const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const jwt = require("jsonwebtoken");
const port = process.env.port || 8000;

// middleware
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
  ],
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = { email: decoded };
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2aarqjz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const db = client.db("job-hunting");
    const jobCollection = db.collection("jobs");
    const appliesCollection = db.collection("applies");

    // await client.connect();
    app.post("/jwt", async (req, res) => {
      const { email } = req.body;
      const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET);
      res.send({ token });
    });

    //Logout
    app.get("/logout", async (req, res) => {
      try {
        res
          .clearCookie("token", {
            maxAge: 0,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          })
          .send({ success: true });
        console.log("Logout successful");
      } catch (err) {
        res.status(500).send(err);
      }
    });

    //  jobs related api
    app.get("/jobs", async (req, res) => {
      try {
        const { category, search, sort } = req.query;
        let query = {};
        if (category) {
          query.category = category;
        }
        if (search) {
          query.title = { $regex: search, $options: "i" };
        }
        const sortOrder = sort === "asc" ? 1 : -1;
        const results = await jobCollection
          .find(query)
          .project({ logo: 1, title: 1, description: 1, reviews: 1, rating: 1 })
          .sort({ salary: sortOrder })
          .toArray();
        res.status(200).send({
          success: true,
          message: "Job get successfully",
          data: results,
        });
      } catch (error) {
        res.status(400).send({
          success: false,
          message: "Something went wrong",
          data: error,
        });
      }
    });

    app.get("/job-suggestions", async (req, res) => {
      try {
        const { search } = req.query;
        if (!search) {
          return res.status(200).send({
            success: true,
            message: "No search term provided",
            data: [],
          });
        }
        const results = await jobCollection
          .find({ title: { $regex: search, $options: "i" } })
          .project({ title: 1 })
          .limit(5)
          .toArray();

        res.status(200).send({
          success: true,
          message: "Search suggestions retrieved successfully",
          data: results.map((job) => job.title),
        });
      } catch (error) {
        res.status(400).send({
          success: false,
          message: "Something went wrong",
          data: error,
        });
      }
    });

    app.get("/jobs/:id", verifyToken, async (req, res) => {
      try {
        const { id } = req.params;
        const query = { _id: new ObjectId(id) };
        const result = await jobCollection.findOne(query);
        const existingApplication = await appliesCollection.findOne({
          jobId: id,
          applicantEmail: req.user.email,
        });
        result.applied = !!existingApplication;
        res.status(200).send({
          success: true,
          message: `${result?.title ?? "Job"} get successfully`,
          data: result,
        });
      } catch (error) {
        res.status(400).send({
          success: false,
          message: "Something went wrong",
          data: error,
        });
      }
    });

    app.post("/jobs/:id/apply", verifyToken, async (req, res) => {
      try {
        const jobId = req.params.id;
        const { applicantName, resumeLink, coverLetter = "" } = req.body;

        if (!applicantName || !resumeLink) {
          return res.status(400).send({
            success: false,
            message: "Missing required application information",
          });
        }

        const existingApplication = await appliesCollection.findOne({
          jobId: jobId,
          applicantEmail: req.user.email,
        });

        if (existingApplication) {
          return res.status(400).send({
            success: false,
            message: "You have already applied for this job",
          });
        }

        const application = {
          jobId: jobId,
          applicantName: applicantName,
          applicantEmail: req.user.email,
          resumeLink: resumeLink,
          coverLetter: coverLetter,
          appliedAt: new Date(),
        };

        const result = await appliesCollection.insertOne(application);

        res.status(201).send({
          success: true,
          message: "Application submitted successfully",
          data: result,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Something went wrong",
          data: error.message,
        });
      }
    });

    app.post("/jobs/new", verifyToken, async (req, res) => {
      try {
        const newJob = req.body;
        newJob.date = new Date();
        newJob.email = req.user.email;
        newJob.rating = 0;
        newJob.reviews = [];
        const result = await jobCollection.insertOne(newJob);
        res.status(201).send({
          success: true,
          message: "Job insert successfully",
          data: result,
        });
      } catch (error) {
        res.status(400).send({
          success: false,
          message: "Something went wrong",
          data: error,
        });
      }
    });

    app.get("/category", async (_req, res) => {
      try {
        const result = await jobCollection.distinct("category");
        res.status(201).send({
          success: true,
          message: "Job Category get successfully",
          data: result,
        });
      } catch (error) {
        res.status(400).send({
          success: false,
          message: "Something went wrong",
          data: error,
        });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello from jobHunting..");
});

app.listen(port, () => {
  console.log(`Job Hunting is running on port ${port}`);
});
