const express = require("express");
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
const app = express();
require("dotenv").config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const companyJobs = require("./companyJobs/companyJobs.js");
const featuredcompanyJobs = require("./featuredCompanyJobs/featuredCompanyJobs.js");
const jwt = require("jsonwebtoken");
let port = process.env.port || 8000;
const multer = require("multer");
const Grid = require("gridfs-stream");
const GridFSBucket = require("mongodb").GridFSBucket;
const stream = require("stream");

// middleware
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",

    "https://job-hunting-job-seekers.vercel.app",
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

    const storage = multer.memoryStorage();
    const upload = multer({ storage: storage });

    const jobCollection = db.collection("jobs");
    const appliesCollection = db.collection("applies");
    const companyJobsCollection = db.collection("companyJobs");

    const usersCollection = db.collection("users");
    const companyCollection = db.collection("companies");

    // // followers collection
    // // featured collection
    const featuredcompanyJobsCollection = db.collection("featuredJobs");
    const followersCollection = db.collection("followers");

    // interviewsCollection
    const interviewsCollection = db.collection("interviews");


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
        // console.log("Logout successful");
      } catch (err) {
        res.status(500).send(err);
      }
    });

    //user saving in DB route

    app.put("/user", async (req, res) => {
      const user = req.body;
      const query = { email: user?.email };

      const isExist = await usersCollection.findOne(query);
      if (isExist) {
        return res.send(isExist);
      }
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          ...user,
          timestamp: Date.now(),
        },
      };
      const result = await usersCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });

    // get the all user
    app.get("/users", async (req, res) => {
      const id = req.body;
      const result = await usersCollection.find().toArray();
      res.send(result);
    });
    //delete user
    app.delete(`/user/:id`, verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    //get user information info by email
    app.get(`/user`, async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    //create admin form admin
    app.put(`/user/:id`, verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };

      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    //saving company data into Db
    app.post("/company-data", async (req, res) => {
      const query = req.body;
      const result = await companyCollection.insertOne(query);
      res.send(result);
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
          // .project({ logo: 1, title: 1, description: 1, reviews: 1, rating: 1 })
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

    app.get("/jobs/:id/related", async (req, res) => {
      try {
        const jobId = req.params.id;

        const job = await jobCollection.findOne({ _id: new ObjectId(jobId) });
        if (!job) {
          return res.status(400).send({
            success: false,
            message: "Job not found",
            data: error,
          });
        }

        const relatedJobs = await jobCollection
          .find({
            category: job.category,
            _id: { $ne: new ObjectId(jobId) },
          })
          .project({ logo: 1, title: 1, description: 1, reviews: 1, rating: 1 })
          .limit(4)
          .toArray();

        return res.status(200).send({
          success: true,
          message: `${job?.category} related get successfully`,
          data: relatedJobs,
        });
      } catch (error) {
        res.status(400).send({
          success: false,
          message: "Something went wrong",
          data: error,
        });
      }
    });

    //post Application
    app.post(
      "/jobs/:id/apply",
      upload.single("file"),
      verifyToken,
      async (req, res) => {
        try {
          const bucket = new GridFSBucket(db, { bucketName: "uploads" });
          const readableStream = new stream.Readable();
          readableStream.push(req.file.buffer);
          readableStream.push(null);
          const uploadStream = bucket.openUploadStream(req.file.originalname, {
            contentType: req.file.mimetype,
          });
          readableStream.pipe(uploadStream);
          uploadStream.on("finish", async () => {
            try {
              const jobId = req.params.id;
              const {
                company,
                jobTitle,
                email,
                coverLetter = "",
                applicantName,
              } = req.body;

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
                applicant: {
                  name: applicantName,
                  email: req?.user?.email,
                },
                resume: uploadStream.id,
                coverLetter,
                status: "pending",
                jobTitle,
                appliedAt: new Date(),
                email,
                company,
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

          uploadStream.on("error", (err) => {
            console.error(err);
            return res
              .status(500)
              .json({ message: "Error uploading file", error: err });
          });
        } catch (err) {
          console.error(err);
          return res.status(500).json({ message: "Server Error", error: err });
        }
      }
    );

    app.post("/jobs/:id/review", verifyToken, async (req, res) => {
      try {
        const { review, rating } = req.body;
        const { email } = req.user;
        const jobId = req.params.id;

        if (!rating || rating < 1 || rating > 5) {
          return res.status(400).send({
            success: false,
            message: "Rating must be between 1 and 5.",
            data: null,
          });
        }

        const job = await jobCollection.findOne({ _id: new ObjectId(jobId) });
        if (!job) {
          return res.status(404).send({
            success: false,
            message: "Job not found",
            data: null,
          });
        }

        const existingReview = job.reviews?.find(
          (review) => review.email === email
        );

        if (existingReview) {
          const result = await jobCollection.updateOne(
            { _id: new ObjectId(jobId), "reviews.email": email },
            {
              $set: {
                "reviews.$.review": review,
                "reviews.$.rating": rating,
                "reviews.$.updatedAt": new Date(),
              },
            }
          );
        } else {
          const newReview = {
            email,
            review,
            rating,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const result = await jobCollection.updateOne(
            { _id: new ObjectId(jobId) },
            { $push: { reviews: newReview } }
          );

          if (result.modifiedCount === 0) {
            return res.status(400).send({
              success: false,
              message: "Failed to add review",
              data: null,
            });
          }
        }

        const updatedJob = await jobCollection.findOne({
          _id: new ObjectId(jobId),
        });
        const reviews = updatedJob.reviews || [];

        const avgRating =
          reviews.reduce((acc, review) => acc + review.rating, 0) /
          reviews.length;

        await jobCollection.updateOne(
          { _id: new ObjectId(jobId) },
          { $set: { rating: avgRating } }
        );

        return res.send({
          success: true,
          message: existingReview
            ? "Review updated successfully"
            : "Review added successfully",
          data: null,
        });
      } catch (error) {
        // console.log(error);
        res.status(500).send({
          success: false,
          message: "Something went wrong",
          data: error.message,
        });
      }
    });

    app.delete("/jobs/:id/review", verifyToken, async (req, res) => {
      try {
        const { email } = req.user;
        const jobId = req.params.id;

        const job = await jobCollection.findOne({ _id: new ObjectId(jobId) });
        if (!job) {
          return res.status(404).send({
            success: false,
            message: "Job not found",
            data: null,
          });
        }

        const existingReview = job.reviews?.find(
          (review) => review.email === email
        );

        if (!existingReview) {
          return res.status(404).send({
            success: false,
            message: "Review not found for this user",
            data: null,
          });
        }

        const result = await jobCollection.updateOne(
          { _id: new ObjectId(jobId) },
          { $pull: { reviews: { email } } }
        );

        if (result.modifiedCount === 0) {
          return res.status(400).send({
            success: false,
            message: "Failed to delete review",
            data: null,
          });
        }

        const updatedJob = await jobCollection.findOne({
          _id: new ObjectId(jobId),
        });
        const reviews = updatedJob.reviews || [];

        const avgRating =
          reviews.length > 0
            ? reviews.reduce((acc, review) => acc + review.rating, 0) /
              reviews.length
            : 0;

        await jobCollection.updateOne(
          { _id: new ObjectId(jobId) },
          { $set: { rating: avgRating } }
        );

        return res.send({
          success: true,
          message: "Review deleted successfully",
          data: null,
        });
      } catch (error) {
        // console.log(error);
        res.status(500).send({
          success: false,
          message: "Something went wrong",
          data: error.message,
        });
      }
    });

    //all application info
    app.get("/applications", async (req, res) => {
      const result = await appliesCollection.find().toArray();
      res.send(result);
    });

    //change application status form host
    app.put(`/applications/:id`, verifyToken, async (req, res) => {
      const id = req.params.id;
      const { status } = req.body;
      const filter = { _id: new ObjectId(id) };

      // Make sure 'status' exists before proceeding
      if (!status) {
        return res.status(400).send({ message: "Status is required" });
      }

      const updateDoc = {
        $set: {
          status: status,
        },
      };

      try {
        const result = await appliesCollection.updateOne(filter, updateDoc);
        if (result.modifiedCount === 1) {
          res.send({ message: "Application status updated successfully" });
        } else {
          res.status(404).send({ message: "Application not found" });
        }
      } catch (error) {
        res.status(500).send({ message: "Error updating status", error });
      }
    });

    //get application information by host email
    app.get(`/applications-host`, async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await appliesCollection.find(query).toArray();
      res.send(result);
    });

    //get resume*********
    app.get(`/resume/:id`, async (req, res) => {
      try {
        const fileId = new ObjectId(req.params.id); // The resume's ObjectId stored in the DB
        const bucket = new GridFSBucket(db, { bucketName: "uploads" });

        // Find the file in GridFS
        const files = await bucket.find({ _id: fileId }).toArray();

        if (!files || files.length === 0) {
          return res.status(404).json({
            success: false,
            message: "File not found",
          });
        }

        // Set the response headers for the file
        res.set({
          "Content-Type": files[0].contentType,
          "Content-Disposition": `attachment; filename="${files[0].filename}"`,
        });

        // Stream the file content back to the client
        const downloadStream = bucket.openDownloadStream(fileId);
        downloadStream.pipe(res);

        downloadStream.on("error", (err) => {
          res.status(500).send({
            success: false,
            message: "Error downloading file",
            error: err.message,
          });
        });
      } catch (err) {
        res.status(500).send({
          success: false,
          message: "Something went wrong",
          error: err.message,
        });
      }
    });

    //get application information by email
    app.get(`/application`, async (req, res) => {
      const email = req.query.email;
      const applicantEmail = applicant.email;
      const query = { applicantEmail: email };
      const result = await appliesCollection.find(query).toArray();
      res.send(result);
    });

    //delete application by id
    app.delete(`/application/:id`, async (req, res) => {
      const id = req.params.id;
      const quary = { _id: new ObjectId(id) };
      const result = await appliesCollection.deleteOne(quary);
      res.send(result);
    });

    //post job api
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

    //get job information by email
    app.get(`/job`, async (req, res) => {
      try {
        const email = req.query.email;
        const query = { email: email };
        const result = await jobCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        res.status(400).send({
          success: false,
          message: "Something went wrong",
          data: error,
        });
      }
    });

    //delete job by id
    app.delete(`/job/:id`, async (req, res) => {
      try {
        const id = req.params.id;
        const quary = { _id: new ObjectId(id) };
        const result = await jobCollection.deleteOne(quary);
        res.send(result);
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

    // // company jobs collection

    // // random 5 data get from collection

    app.get("/company/collection/interested", async (req, res) => {
      try {
        let result = await companyJobsCollection
          .aggregate([
            {
              $sample: { size: 5 },
            },
          ])
          .toArray();
        res.status(200).json(result);
      } catch (error) {
        res
          .status(500)
          .json({ message: "An error occurred", error: error.message });
      }
    });

    // // get data by id

    app.get("/company/collection/jobs/:id", async (req, res) => {
      try {
        let id = req.params.id;
        // console.log(id);

        let result = await companyJobsCollection.findOne({
          _id: new ObjectId(id),
        });
        // console.log(result);

        res.send(result);
      } catch (error) {
        res.send({ message: error.message });
      }
    });

    // // featured company jobs

    app.get("/featured/company/jobs", async (req, res) => {
      try {
        // console.log(companyJobs);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const companyName = req.query.companyName;

        const totalJobs = await featuredcompanyJobsCollection.countDocuments();
        const totalPages = Math.ceil(totalJobs / limit);

        {
          const jobs = await featuredcompanyJobsCollection
            .find({})
            .skip((page - 1) * limit) // Skip the jobs of previous pages
            .limit(limit) // Limit the jobs to 'limit' number
            .toArray();

          res.json({
            jobs,
            totalPages,
            currentPage: page,
            totalJobs,
          });
        }
      } catch (error) {
        res.json({ error: error.message });
      }
    });

    // // featured jobs

    app.get("/featured/jobs", async (req, res) => {
      try {
        let isResult = await featuredcompanyJobsCollection.deleteMany();

        // console.log(isResult);

        if (isResult.acknowledged == true) {
          let posted = await featuredcompanyJobsCollection.insertMany(
            featuredcompanyJobs
          );
          // return res.send(posted)
          // console.log(posted);
          if (posted.acknowledged == true) {
            let result = await featuredcompanyJobsCollection.find().toArray();
            // console.log(result);

            res.send(result);
          }
        }
      } catch (error) {
        res.status(400).send({
          success: false,
          message: "Something went wrong",
          error: error.message,
        });
      }
    });

    // // get data by id

    app.get("/featured/jobs/:id", async (req, res) => {
      try {
        let id = req.params.id;
        // console.log(id);

        let result = await featuredcompanyJobsCollection.findOne({
          _id: new ObjectId(id),
        });
        // console.log(result);

        res.send(result);
      } catch (error) {
        res.send({ message: error.message });
      }
    });

    // // followers task

    app.post("/view-jobs/followers", async (req, res) => {
      try {
        let followerInfo = req.body;
        const followed = await followersCollection.findOne({
          email: req.body.email,
        });
        if (followed) {
          return res.send({ message: "already included" });
        }
        // console.log(followerInfo);
        let result = await followersCollection.insertOne(followerInfo);
        return res.json(result).status(200);
      } catch (error) {
        return res.json(
          { message: "something went wrong", error: error.message },
          { status: 500 }
        );
      }
    });

    // //  is follower

    app.get("/follower/:email", async (req, res) => {
      try {
        const { email } = req.params;
        // console.log(email);

        // Check if email exists in the collection
        const result = await followersCollection.findOne({ email: email });

        if (result) {
          // console.log(result);
          res
            .status(200)
            .send({ message: "Email found in followers", isFound: true });
        } else {
          res
            .status(404)
            .send({ message: "Email not found in followers", isFound: false });
        }
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.message });
      }
    });

    app.get("/followers", async (req, res) => {
      try {
        // Check if email exists in the collection
        const result = await followersCollection.find().toArray();

        if (result) {
          // console.log(result);
          res.status(200).send({ message: " followers found", data: result });
        } else {
          res.status(404).send({ message: " followers not found" });
        }
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.message });
      }
    });

    // // unfollow

    app.delete("/user/follower/:email", async (req, res) => {
      try {
        let result = await followersCollection.deleteOne({
          email: req.params.email,
        });
        res.json({ message: "deleted successfully", result }).status(200);
      } catch (error) {
        return res
          .json({ message: "something went wrong", error: error.message })
          .status(500);
      }
    });

    app.get("/company/jobs", async (req, res) => {
      try {
        // console.log(companyJobs);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const companyName = req.query.companyName;

        let isResult = await companyJobsCollection.deleteMany();

        // console.log(isResult);

        if (isResult.acknowledged == true) {
          let posted = await companyJobsCollection.insertMany(companyJobs);
          // return res.send(posted)
          // console.log(posted);

          const totalJobs = await companyJobsCollection.countDocuments();
          const totalPages = Math.ceil(totalJobs / limit);

          // if (posted.acknowledged == true) {
          //   let result = await companyJobsCollection.find().toArray()
          //   return res.send(result)
          // }

          if (posted.acknowledged == true) {
            const jobs = await companyJobsCollection
              .find({})
              .skip((page - 1) * limit) // Skip the jobs of previous pages
              .limit(limit) // Limit the jobs to 'limit' number
              .toArray();

            res.json({
              jobs,
              totalPages,
              currentPage: page,
              totalJobs,
            });
          }
        }

        // let result =await companyJobsCollection.find().toArray()
        // console.log(result);
      } catch (error) {}
    });

    app.delete("/jobs/:id/apply", verifyToken, async (req, res) => {
      try {
        const { id } = req.params;
        const applicantEmail = req.user.email;

        if (!id || !applicantEmail) {
          return res.status(400).send({
            success: false,
            message:
              "Job ID and applicant email are required to cancel application",
          });
        }

        const query = { jobId: id, applicantEmail };
        const existingApplication = await appliesCollection.findOne(query);

        if (!existingApplication) {
          return res.status(404).send({
            success: false,
            message: "Application not found",
          });
        }

        const deleteResult = await appliesCollection.deleteOne(query);

        if (deleteResult.deletedCount === 1) {
          return res.status(200).send({
            success: true,
            message: "Application cancelled successfully",
          });
        } else {
          return res.status(500).send({
            success: false,
            message: "Failed to cancel application",
          });
        }
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Something went wrong",
          data: error.message,
        });
      }
    });


    // Interview related route
    app.post("/schedule", async (req, res) => {

      const { eventName, description, duration, selectedDate, selectedTime } = req.body;

      if (!eventName || !duration || !selectedDate || !selectedTime) {
        return res.status(400).json({ message: "Please provide all required fields" });
      }
    
      const newEvent = {
        eventName,
        description,
        duration,
        selectedDate,
        selectedTime,
      };
      try {
        
        const result = await db.interviewsCollection("interviews").insertOne(newEvent);
        res.status(201).json({ message: "Interview scheduled successfully", data: result });
      } catch (err) {
        res.status(500).json({ message: "Failed to schedule interview", error: err });
      }
     
    });

    app.get("/schedule", async (req, res) => {
      try {
        
        const interviews = await db.interviewsCollection("interviews").find().toArray();
        res.status(200).json(interviews);
      } catch (err) {
        res.status(500).json({ message: "Failed to retrieve interviews", error: err });
      }
    });

    // Interview route





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

// api api here
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

app.post("/ai", async (req, res) => {
  const chatSession = model.startChat({
    generationConfig,
    history: [],
  });

  const result = await chatSession.sendMessage(req.body.message);
  res.json({ response: result.response.candidates[0].content.parts[0].text });
});

app.listen(port, () => {
  console.log(`Job Hunting is running on port ${port}`);
});
