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
const multer = require('multer');
const Grid = require('gridfs-stream')
const GridFSBucket = require('mongodb').GridFSBucket;
const stream = require('stream');
const sponsored = require("./sponsoredCompanies/sponsored.js");
const eventChallenge = require("./eventChallenge/eventChallenge.js")
// const multer = require("multer");
// const Grid = require("gridfs-stream");
// const GridFSBucket = require("mongodb").GridFSBucket;
// const stream = require("stream");

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
  const token = req.headers.authorization?.split(" ")[1];
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

    // soposored companies collection

    const sponsoredCompanyJobsCollection = db.collection("sponsoredJobs");
    const eventChallengeCollection = db.collection('eventJobs')
    // // followers collection
    // // featured collection
    const featuredcompanyJobsCollection = db.collection("featuredJobs");
    const followersCollection = db.collection("followers");

    const paymentCollection = db.collection("payment");

    // interviewsCollection
    const interviewsCollection = db.collection("interviews");

    // ai api start
    app.post("/ai", async (req, res) => {
      const { jobId, type = "", skills = "", message } = req.body;

      try {
        let job = null;

        if (jobId && typeof jobId === "string") {
          job = await jobCollection.findOne(
            { _id: new ObjectId(jobId) },
            { projection: { title: 1, description: 1 } }
          );
          if (!job) {
            return res.status(404).json({ error: "Job not found" });
          }
        }

        const chatSession = model.startChat({
          generationConfig,
          history: [],
        });

        let aiMessage = "";
        if (type === "interview") {
          if (job) {
            aiMessage = `I am applying for the position of ${job.title}. Can you give me a mock interview based on the job description: ${job.description}?`;
          } else {
            aiMessage = `Can you give me a mock interview based on a general job description?`;
          }
        } else if (type === "isJobForYou") {
          if (job) {
            aiMessage = `I have the following skills: ${skills}. Based on the job description: "${job.description}", is this job a good match for me?`;
          } else {
            aiMessage = `I have the following skills: ${skills}. Can you help me determine if I am suited for a job based on these skills?`;
          }
        } else {
          aiMessage = `This is a general message to the AI: ${message}`;
        }

        const result = await chatSession.sendMessage(aiMessage);

        res.json({
          response: result.response.candidates[0].content.parts[0].text,
        });
      } catch (error) {
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // ai api end

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

    app.post("/jobs/:id/apply", upload.single('file'), verifyToken, async (req, res) => {
      try {
        const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
        const readableStream = new stream.Readable();
        readableStream.push(req.file.buffer);
        readableStream.push(null);
        const uploadStream = bucket.openUploadStream(req.file.originalname, {
          contentType: req.file.mimetype,
        });
        readableStream.pipe(uploadStream);
        uploadStream.on('finish', async () => {
          try {
            const jobId = req.params.id;
            const {

              jobTitle,

              coverLetter = "",
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
              applicantEmail: req.user.email,
              resume: uploadStream.id,
              coverLetter,
              status: 'pending',
              jobTitle,
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

        uploadStream.on('error', (err) => {
          console.error(err);
          return res.status(500).json({ message: 'Error uploading file', error: err });
        });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server Error', error: err });
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
      // const applicantEmail = applicant.email;
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


    // // home branch

    app.get('/category-button', async (req, res) => {
      try {
        // Destructure the category query parameter from req.query
        let { category } = req.query;
        console.log(category);
    
        // Use the category variable to find jobs
        let result = await jobCollection.find({ category }).toArray();
        console.log(result);
        
        // Send the result back to the client
        return res.send(result);
    
      } catch (error) {
        // Handle errors and send them to the client
        return res.status(500).send(error.message);
      }
    });
    




    //

    // // search filter

    app.get('/job/search', async (req, res) => {
      try {
        const { location, type } = req.query;
        console.log(req.query);

        // Create a query object dynamically based on the existence of the parameters
        let query = {};

        if (location) {
          query.location = location;
        }

        if (type) {
          query.type = type;
        }

        // Assuming you have a MongoDB collection called 'jobs'
        const jobs = await jobCollection.find(query).toArray();

        if (jobs.length > 0) {
          res.status(200).json(jobs);
        } else {
          res.status(404).json({ message: 'No jobs found matching the criteria' });
        }
      } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
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



    // app.get('/featured/company/jobs', async (req, res) => {
    //   try {
    //     // console.log(companyJobs);
    //     const page = parseInt(req.query.page) || 1;
    //     const limit = parseInt(req.query.limit) || 12;
    //     const companyName = req.query.companyName

    //     const totalJobs = await featuredcompanyJobsCollection.countDocuments();
    //     const totalPages = Math.ceil(totalJobs / limit);

    //     {
    //       const jobs = await featuredcompanyJobsCollection.find({})
    //         .skip((page - 1) * limit)  // Skip the jobs of previous pages
    //         .limit(limit)              // Limit the jobs to 'limit' number
    //         .toArray();

    //       res.json({
    //         jobs,
    //         totalPages,
    //         currentPage: page,
    //         totalJobs
    //       });
    //     }

    //   } catch (error) {
    //     res.json({ error: error.message })
    //   }
    // })





    // app.get('/featured/company/jobs', async (req, res) => {
    //   try {
    //     // Extract pagination parameters
    //     const page = parseInt(req.query.page) || 1;
    //     const limit = parseInt(req.query.limit) || 12;

    //     // Extract filters from the query or use example values
    //     const {
    //       selectedBusinessTypes = req.query.selectedBusinessTypes instanceof Array ==false && [req.query.selectedBusinessTypes],
    //       selectedCompanyTypes = [],   // Company types (e.g., Public, Private)
    //       selectedIndustries = [],     // Industries (e.g., Telecom, Financial)
    //       selectedSectors = []         // Sectors (e.g., GS, EG)
    //     } = req.query;

    //     console.log(selectedBusinessTypes);

    //     // Initialize an empty filters object
    //     const filters = {};

    //     // Apply filters for selectedBusinessTypes if they exist
    //     if (selectedBusinessTypes.length > 0) {
    //       filters.tags = {
    //         $in: selectedBusinessTypes.map(type => new RegExp(type, 'i')) // Case-insensitive regex matching
    //       };
    //     }

    //     // Apply filters for selectedCompanyTypes if they exist
    //     if (selectedCompanyTypes.length > 0) {
    //       filters.tags = {
    //         $in: selectedCompanyTypes.map(type => new RegExp(type, 'i')) // Case-insensitive regex matching
    //       };
    //     }

    //     // Apply filters for selectedIndustries if they exist
    //     if (selectedIndustries.length > 0) {
    //       filters.tags = {
    //         $in: selectedIndustries.map(industry => new RegExp(industry, 'i')) // Case-insensitive regex matching
    //       };
    //     }

    //     // Apply filters for selectedSectors if they exist
    //     if (selectedSectors.length > 0) {
    //       filters.tags = {
    //         $in: selectedSectors.map(sector => new RegExp(sector, 'i')) // Case-insensitive regex matching
    //       };
    //     }

    //     // Count the total jobs that match the filters
    //     const totalJobs = await featuredcompanyJobsCollection.countDocuments(filters);
    //     const totalPages = Math.ceil(totalJobs / limit);

    //     // Fetch the jobs with pagination and filtering
    //     const jobs = await featuredcompanyJobsCollection.find(filters)
    //       .skip((page - 1) * limit)
    //       .limit(limit)
    //       .toArray();

    //     console.log('Total jobs found:', jobs.length);

    //     // Send the response with jobs and pagination info
    //     res.json({
    //       jobs,
    //       totalPages,
    //       currentPage: page,
    //       totalJobs
    //     });

    //   } catch (error) {
    //     console.error('Error fetching jobs:', error);
    //     res.status(500).json({ error: error.message });
    //   }
    // });




    app.get('/featured/company/jobs', async (req, res) => {
      try {
        // Extract pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;

        // Extract filters from the query, ensuring they are arrays
        const selectedBusinessTypes = Array.isArray(req.query.selectedBusinessTypes)
          ? req.query.selectedBusinessTypes
          : req.query.selectedBusinessTypes ? [req.query.selectedBusinessTypes] : [];

        const selectedCompanyTypes = Array.isArray(req.query.selectedCompanyTypes)
          ? req.query.selectedCompanyTypes
          : req.query.selectedCompanyTypes ? [req.query.selectedCompanyTypes] : [];

        const selectedIndustries = Array.isArray(req.query.selectedIndustries)
          ? req.query.selectedIndustries
          : req.query.selectedIndustries ? [req.query.selectedIndustries] : [];

        const selectedSectors = Array.isArray(req.query.selectedSectors)
          ? req.query.selectedSectors
          : req.query.selectedSectors ? [req.query.selectedSectors] : [];

        // Initialize an empty filters object
        const filters = {};

        // Apply filters for selectedBusinessTypes if they exist
        if (selectedBusinessTypes.length > 0) {
          filters.tags = {
            ...filters.tags,
            $in: selectedBusinessTypes.map(type => new RegExp(type, 'i')) // Case-insensitive regex matching
          };
        }

        // Apply filters for selectedCompanyTypes if they exist
        if (selectedCompanyTypes.length > 0) {
          filters.tags = {
            ...filters.tags,
            $in: selectedCompanyTypes.map(type => new RegExp(type, 'i')) // Case-insensitive regex matching
          };
        }

        // Apply filters for selectedIndustries if they exist
        if (selectedIndustries.length > 0) {
          filters.tags = {
            ...filters.tags,
            $in: selectedIndustries.map(industry => new RegExp(industry, 'i')) // Case-insensitive regex matching
          };
        }

        // Apply filters for selectedSectors if they exist
        if (selectedSectors.length > 0) {
          filters.tags = {
            ...filters.tags,
            $in: selectedSectors.map(sector => new RegExp(sector, 'i')) // Case-insensitive regex matching
          };
        }

        // Count the total jobs that match the filters
        const totalJobs = await featuredcompanyJobsCollection.countDocuments(filters);
        const totalPages = Math.ceil(totalJobs / limit);

        // Fetch the jobs with pagination and filtering
        const jobs = await featuredcompanyJobsCollection.find(filters)
          .skip((page - 1) * limit)
          .limit(limit)
          .toArray();

        console.log('Total jobs found:', jobs.length);

        // Send the response with jobs and pagination info
        res.json({
          jobs,
          totalPages,
          currentPage: page,
          totalJobs
        });

      } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({ error: error.message });
      }
    });






    app.get('/search', async (req, res) => {
      try {

        // Define the tags you're searching for (e.g., B2B and B2C)
        const tagsToSearch = ['B2B', 'B2C'];

        // Find documents where the 'tags' array contains elements that match exactly or partially
        const query = {
          tags: {
            $in: tagsToSearch.map(tag => new RegExp(tag, 'i')) // Case-insensitive regex matching
          }
        };

        const result = await featuredcompanyJobsCollection.find(query).toArray();
        console.log(result);

        res.status(200).json(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
      } finally {
        await client.close(); // Ensure to close the MongoDB connection
      }
    });











    // sponsored starts
    // app.get("/sponsored/jobs", async (req, res) => {
    //   try {
    //     let isResult = await sponsoredCompanyJobsCollection.deleteMany();

    //     console.log(isResult);

    //     if (isResult.acknowledged == true) {
    //       let posted = await sponsoredCompanyJobsCollection.insertMany(
    //         sponsored
    //       );
    //       // return res.send(posted)
    //       console.log(posted);
    //       if (posted.acknowledged == true) {
    //         let result = await sponsoredCompanyJobsCollection.find().toArray();
    //         console.log(result);

    //         res.send(result);
    //       }
    //     }
    //   } catch (error) {
    //     res.status(400).send({
    //       success: false,
    //       message: "Something went wrong",
    //       error: error.message,
    //     });
    //   }
    // });






    // featured jobs
    // for inserting featured data
    // app.get("/featured/company/jobs", async (req, res) => {
    //   try {
    //     // console.log(companyJobs);
    //     const page = parseInt(req.query.page) || 1;
    //     const limit = parseInt(req.query.limit) || 12;
    //     const companyName = req.query.companyName;

    //     const totalJobs = await featuredcompanyJobsCollection.countDocuments();
    //     const totalPages = Math.ceil(totalJobs / limit);

    //     {
    //       const jobs = await featuredcompanyJobsCollection
    //         .find({})
    //         .skip((page - 1) * limit) // Skip the jobs of previous pages
    //         .limit(limit) // Limit the jobs to 'limit' number
    //         .toArray();

    //       res.json({
    //         jobs,
    //         totalPages,
    //         currentPage: page,
    //         totalJobs,
    //       });
    //     }
    //   } catch (error) {
    //     res.json({ error: error.message });
    //   }
    // });


    // app.get("/featured/jobs", async (req, res) => {
    //   try {
    //     let isResult = await featuredcompanyJobsCollection.deleteMany();


    //     if (isResult.acknowledged == true) {
    //       let posted = await featuredcompanyJobsCollection.insertMany(
    //         featuredcompanyJobs
    //       );
    //       // return res.send(posted)
    //       // console.log(posted);
    //       if (posted.acknowledged == true) {
    //         let result = await featuredcompanyJobsCollection.find().toArray();
    //         // console.log(result);

    //         res.send(result);
    //       }
    //     }
    //   } catch (error) {
    //     res.status(400).send({
    //       success: false,
    //       message: "Something went wrong",
    //       error: error.message,
    //     });
    //   }
    // });


    // // event challenge

    app.get("/event/challenge", async (req, res) => {
      try {
        let isResult = await eventChallengeCollection.deleteMany();


        if (isResult.acknowledged == true) {
          let posted = await eventChallengeCollection.insertMany(
            eventChallenge
          );
          // return res.send(posted)
          // console.log(posted);
          if (posted.acknowledged == true) {
            let result = await eventChallengeCollection.find().toArray();
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



    app.get("/event/challenge/:id", async (req, res) => {
      try {
        let result = await eventChallengeCollection.findOne({ _id: new ObjectId(req.params.id) })
        return res.send(result)
      } catch (error) {
        return res.json({ message: 'something error', error: error.message }).status(500)
      }
    })


    app.get('/sponsored/companies', async (req, res) => {
      try {
        const category = req.query.category; // category from the frontend query param
        let query = {};

        // If category is not "All", filter by the category
        if (category && category !== 'All') {
          query = { tags: category }; // Check if 'tags' array contains the selected category
        }

        const companies = await sponsoredCompanyJobsCollection.find(query).toArray();
        res.status(200).json(companies);
      } catch (error) {
        res.status(500).json({ message: 'Error fetching companies' });
      }
    });

    // sponsored ends




    app.get('/api/featured-jobs', async (req, res) => {
      const category = req.query.category || 'All'; // Get the category from query parameters
      console.log(category);

      try {
        let query = {};
        if (category !== 'All') {
          query = { tags: category }; // Filter by category tags 
        }

        const jobs = await featuredcompanyJobsCollection.find(query).toArray();
        // console.log(jobs);

        res.status(200).json(jobs);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
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

          res
            .status(200)
            .send({ message: "Email found in followers", isFound: true });
        } else {
          res
            .status(404)
            .send({ message: "Email not found in followers", isFound: false });
        }
      } catch (error) {
        // console.error(error);
        res.status(500).send({ error: error.message });
      }
    });

    app.get("/followers", async (req, res) => {
      try {
        // Check if email exists in the collection
        const result = await followersCollection.find().toArray();

        if (result) {
          res.status(200).send({ message: " followers found", data: result });
        } else {
          res.status(404).send({ message: " followers not found" });
        }
      } catch (error) {
        //   console.error(error);
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
        console.log('cnam', companyName);

        const totalJobs = await companyJobsCollection.countDocuments();
        const totalPages = Math.ceil(totalJobs / limit);

        // if (posted.acknowledged == true) {
        //   let result = await companyJobsCollection.find().toArray()
        //   return res.send(result)
        // }


        const jobs = await companyJobsCollection
          .find({ companyName: companyName })
          .skip((page - 1) * limit) // Skip the jobs of previous pages
          .limit(limit) // Limit the jobs to 'limit' number
          .toArray();

        res.json({
          jobs,
          totalPages,
          currentPage: page,
          totalJobs,
        });



        // let result =await companyJobsCollection.find().toArray()
        // console.log(result);
      } catch (error) { }
    });


    //payment posting route
    app.post('/api/payment', async (req, res) => {
      const { amount, payerEmail, status, type } = req.body;

      try {

        const paymentIntent = await stripe.paymentIntents.create({
          amount: parseInt(amount),
          currency: 'usd',
          payment_method_types: ['card']
        });


        const paymentData = {
          email: payerEmail,
          amount,
          createdAt: new Date(),
          status,
          type,
          paymentIntentId: paymentIntent.id,
        };

        const result = await paymentCollection.insertOne(paymentData);

        res.send({
          clientSecret: paymentIntent.client_secret
        })

      } catch (error) {
        console.error('Error processing payment:', error);
        return res.status(500).send('Error processing payment');
      }
    });

    //get payment by email
    app.get('/api/payment/:email', async (req, res) => {
      const email = req.params.email;

      try {
        const payments = await paymentCollection.find({ email }).toArray();

        if (payments.length > 0) {
          return res.json(payments);
        } else {
          return res.status(404).json({ message: 'No payments found for this ID' });
        }
      } catch (error) {
        console.error('Error fetching payment data:', error);
        return res.status(500).send('Error fetching payment data');
      }
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
      const { eventName, description, duration, selectedDate, selectedTime } =
        req.body;

      if (!eventName || !duration || !selectedDate || !selectedTime) {
        return res
          .status(400)
          .json({ message: "Please provide all required fields" });
      }

      const newEvent = {
        eventName,
        description,
        duration,
        selectedDate,
        selectedTime,
      };
      try {
        const result = await db
          .interviewsCollection("interviews")
          .insertOne(newEvent);
        res
          .status(201)
          .json({ message: "Interview scheduled successfully", data: result });
      } catch (err) {
        res
          .status(500)
          .json({ message: "Failed to schedule interview", error: err });
      }
    });

    app.get("/schedule", async (req, res) => {
      try {
        const interviews = await db
          .interviewsCollection("interviews")
          .find()
          .toArray();
        res.status(200).json(interviews);
      } catch (err) {
        res
          .status(500)
          .json({ message: "Failed to retrieve interviews", error: err });
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

app.listen(port, () => {
  console.log(`Job Hunting is running on port ${port}`);
});
