// let event= [
//     {
//       "logo": "https://example.com/logo1.png",
//       "coverPhoto": "https://do-hackathon-company-assets-prod.s3.ap-southeast-1.amazonaws.com/tavant/contest_banner_1536.png",
//       "companyName": "Google",
//       "title": "Full Stack Developer Hiring Challenge",
//       "tags": ["JavaScript", "React", "Node.js", "Full Stack", "Web Development"],
//       "time": "9:00 AM - 12:00 PM",
//       "date": "2024-11-05",
//       "enrolled": "3.2k",
//       "about": "Google is hiring Full Stack Developers...",
//       "Criteria": "3 years of experience with React, Node.js...",
//       "reviews": "10234",
//       "ratings": "45k",
//       "Industry": "Tech",
//       "CompanyType": "Public"
//     },
//     {
//       "logo": "https://example.com/logo2.png",
//       "coverPhoto": "https://do-hackathon-company-assets-prod.s3.ap-southeast-1.amazonaws.com/tavant/contest_banner_1536.png",
//       "companyName": "Microsoft",
//       "title": "Cloud Engineer Hiring Event",
//       "tags": ["Azure", "Cloud Computing", "DevOps", "CI/CD"],
//       "time": "10:00 AM - 1:00 PM",
//       "date": "2024-12-10",
//       "enrolled": "5.1k",
//       "about": "Join Microsoft’s cloud engineering team...",
//       "Criteria": "Experience in cloud architecture...",
//       "reviews": "8421",
//       "ratings": "39k",
//       "Industry": "Tech",
//       "CompanyType": "Public"
//     },
//     {
//       "logo": "https://example.com/logo3.png",
//       "coverPhoto": "https://do-hackathon-company-assets-prod.s3.ap-southeast-1.amazonaws.com/tavant/contest_banner_1536.png",
//       "companyName": "Amazon",
//       "title": "Backend Engineer Challenge",
//       "tags": ["Java", "Microservices", "AWS", "Backend"],
//       "time": "11:00 AM - 2:00 PM",
//       "date": "2024-11-15",
//       "enrolled": "4.6k",
//       "about": "Amazon is looking for backend engineers...",
//       "Criteria": "Expertise in Java and cloud services...",
//       "reviews": "9512",
//       "ratings": "37k",
//       "Industry": "E-commerce",
//       "CompanyType": "Public"
//     },
//     {
//       "logo": "https://example.com/logo4.png",
//       "coverPhoto": "https://do-hackathon-company-assets-prod.s3.ap-southeast-1.amazonaws.com/tavant/contest_banner_1536.png",
//       "companyName": "Meta",
//       "title": "Data Science Hiring Challenge",
//       "tags": ["Python", "Machine Learning", "Data Science", "AI"],
//       "time": "12:00 PM - 3:00 PM",
//       "date": "2024-11-20",
//       "enrolled": "6.8k",
//       "about": "Meta is looking for data scientists...",
//       "Criteria": "2+ years of experience in data science...",
//       "reviews": "7650",
//       "ratings": "50k",
//       "Industry": "Social Media",
//       "CompanyType": "Public"
//     },
//     {
//       "logo": "https://example.com/logo5.png",
//       "coverPhoto": "https://do-hackathon-company-assets-prod.s3.ap-southeast-1.amazonaws.com/tavant/contest_banner_1536.png",
//       "companyName": "Tesla",
//       "title": "Embedded Systems Engineer Challenge",
//       "tags": ["C", "Embedded Systems", "Hardware", "IoT"],
//       "time": "1:00 PM - 4:00 PM",
//       "date": "2024-12-01",
//       "enrolled": "2.9k",
//       "about": "Tesla is hiring embedded systems engineers...",
//       "Criteria": "3+ years in embedded systems...",
//       "reviews": "5120",
//       "ratings": "29k",
//       "Industry": "Automotive",
//       "CompanyType": "Public"
//     },
//     {
//       "logo": "https://example.com/logo6.png",
//       "coverPhoto": "https://do-hackathon-company-assets-prod.s3.ap-southeast-1.amazonaws.com/tavant/contest_banner_1536.png",
//       "companyName": "Netflix",
//       "title": "Frontend Developer Hiring Challenge",
//       "tags": ["React", "JavaScript", "Frontend", "CSS"],
//       "time": "2:00 PM - 5:00 PM",
//       "date": "2024-11-25",
//       "enrolled": "3.5k",
//       "about": "Netflix is hiring frontend developers...",
//       "Criteria": "Expert in React and frontend development...",
//       "reviews": "8356",
//       "ratings": "48k",
//       "Industry": "Entertainment",
//       "CompanyType": "Public"
//     },
//     {
//       "logo": "https://example.com/logo7.png",
//       "coverPhoto": "https://do-hackathon-company-assets-prod.s3.ap-southeast-1.amazonaws.com/tavant/contest_banner_1536.png",
//       "companyName": "Spotify",
//       "title": "Mobile Developer Hiring Challenge",
//       "tags": ["Swift", "Kotlin", "Mobile Development", "iOS", "Android"],
//       "time": "9:00 AM - 12:00 PM",
//       "date": "2024-11-30",
//       "enrolled": "4.1k",
//       "about": "Spotify is hiring mobile app developers...",
//       "Criteria": "Experience in iOS or Android development...",
//       "reviews": "4120",
//       "ratings": "25k",
//       "Industry": "Music Streaming",
//       "CompanyType": "Public"
//     },
//     {
//       "logo": "https://example.com/logo8.png",
//       "coverPhoto": "https://do-hackathon-company-assets-prod.s3.ap-southeast-1.amazonaws.com/tavant/contest_banner_1536.png",
//       "companyName": "Adobe",
//       "title": "UX/UI Designer Hiring Challenge",
//       "tags": ["UI Design", "UX Design", "Adobe XD", "Figma"],
//       "time": "10:00 AM - 1:00 PM",
//       "date": "2024-12-05",
//       "enrolled": "3.7k",
//       "about": "Adobe is hiring UX/UI designers...",
//       "Criteria": "2+ years in UX/UI design...",
//       "reviews": "7510",
//       "ratings": "32k",
//       "Industry": "Software",
//       "CompanyType": "Public"
//     },
//     {
//       "logo": "https://example.com/logo9.png",
//       "coverPhoto": "https://do-hackathon-company-assets-prod.s3.ap-southeast-1.amazonaws.com/tavant/contest_banner_1536.png",
//       "companyName": "Cisco",
//       "title": "Network Engineer Hiring Challenge",
//       "tags": ["Networking", "Routing", "Switching", "CCNA", "CCNP"],
//       "time": "9:00 AM - 12:00 PM",
//       "date": "2024-12-12",
//       "enrolled": "4.5k",
//       "about": "Cisco is looking for network engineers...",
//       "Criteria": "3+ years in network engineering...",
//       "reviews": "5123",
//       "ratings": "28k",
//       "Industry": "Telecommunications",
//       "CompanyType": "Public"
//     },
//     {
//       "logo": "https://example.com/logo10.png",
//       "coverPhoto": "https://do-hackathon-company-assets-prod.s3.ap-southeast-1.amazonaws.com/tavant/contest_banner_1536.png",
//       "companyName": "IBM",
//       "title": "AI Research Engineer Hiring Challenge",
//       "tags": ["AI", "Machine Learning", "Research", "Python"],
//       "time": "10:00 AM - 2:00 PM",
//       "date": "2024-12-20",
//       "enrolled": "2.8k",
//       "about": "IBM is looking for AI researchers...",
//       "Criteria": "PhD in AI or relevant field...",
//       "reviews": "4280",
//       "ratings": "26k",
//       "Industry": "Technology",
//       "CompanyType": "Public"
//     },
//     {
//       "logo": "https://example.com/logo11.png",
//       "coverPhoto": "https://do-hackathon-company-assets-prod.s3.ap-southeast-1.amazonaws.com/tavant/contest_banner_1536.png",
//       "companyName": "Intel",
//       "title": "Hardware Engineer Hiring Challenge",
//       "tags": ["VLSI", "Circuit Design", "Semiconductors"],
//       "time": "11:00 AM - 3:00 PM",
//       "date": "2024-12-15",
//       "enrolled": "3.3k",
//       "about": "Intel is hiring hardware engineers...",
//       "Criteria": "Experience in VLSI or circuit design...",
//       "reviews": "3912",
//       "ratings": "30k",
//       "Industry": "Semiconductors",
//       "CompanyType": "Public"
//     },
//     {
//       "logo": "https://example.com/logo12.png",
//       "coverPhoto": "https://do-hackathon-company-assets-prod.s3.ap-southeast-1.amazonaws.com/tavant/contest_banner_1536.png",
//       "companyName": "Airbnb",
//       "title": "DevOps Engineer Hiring Challenge",
//       "tags": ["DevOps", "Kubernetes", "AWS", "CI/CD"],
//       "time": "1:00 PM - 4:00 PM",
//       "date": "2024-11-10",
//       "enrolled": "3.9k",
//       "about": "Airbnb is hiring DevOps engineers...",
//       "Criteria": "Expertise in AWS and Kubernetes...",
//       "reviews": "6120",
//       "ratings": "41k",
//       "Industry": "Hospitality",
//       "CompanyType": "Public"
//     },
//     {
//       "logo": "https://example.com/logo13.png",
//       "coverPhoto": "https://do-hackathon-company-assets-prod.s3.ap-southeast-1.amazonaws.com/tavant/contest_banner_1536.png",
//       "companyName": "Twitter",
//       "title": "Frontend Developer Hiring Challenge",
//       "tags": ["JavaScript", "HTML", "CSS", "React"],
//       "time": "2:00 PM - 5:00 PM",
//       "date": "2024-12-08",
//       "enrolled": "4.7k",
//       "about": "Twitter is looking for frontend developers...",
//       "Criteria": "Experience in JavaScript and React...",
//       "reviews": "7210",
//       "ratings": "42k",
//       "Industry": "Social Media",
//       "CompanyType": "Public"
//     },
//     {
//       "logo": "https://example.com/logo14.png",
//       "coverPhoto": "https://do-hackathon-company-assets-prod.s3.ap-southeast-1.amazonaws.com/tavant/contest_banner_1536.png",
//       "companyName": "Apple",
//       "title": "iOS Developer Hiring Challenge",
//       "tags": ["iOS", "Swift", "Mobile Development", "Objective-C"],
//       "time": "9:00 AM - 12:00 PM",
//       "date": "2024-12-30",
//       "enrolled": "5.2k",
//       "about": "Apple is looking for iOS developers...",
//       "Criteria": "3+ years in iOS development...",
//       "reviews": "8354",
//       "ratings": "49k",
//       "Industry": "Technology",
//       "CompanyType": "Public"
//     }
//   ]
  
//   module.exports=event




















let event = [
    {
        "logo": "https://example.com/logo1.png",
        "coverPhoto": "https://example.com/coverPhoto1.png",
        "companyName": "Google",
        "title": "Full Stack Developer Hiring Challenge",
        "tags": ["JavaScript", "React", "Node.js", "Full Stack", "Web Development"],
        "time": "9:00 AM - 12:00 PM",
        "date": "2024-11-05",
        "enrolled": "3.2k",
        "about": "Google is hiring Full Stack Developers for various positions...",
        "Criteria": `
            **You should register for this contest if:**
            - Minimum 3 years of hands-on experience in full stack development.
            
            **Preferred skills:**
            - Proficiency in JavaScript, React, Node.js, and working knowledge of cloud services.
        `,
        "reviews": "10.2k",
        "ratings": "45k",
        "Industry": "Tech",
        "CompanyType": "Public"
    },
    {
        "logo": "https://example.com/logo2.png",
        "coverPhoto": "https://example.com/coverPhoto2.png",
        "companyName": "Microsoft",
        "title": "Cloud Engineer Hiring Event",
        "tags": ["Azure", "Cloud Computing", "DevOps", "CI/CD"],
        "time": "10:00 AM - 1:00 PM",
        "date": "2024-12-10",
        "enrolled": "5.1k",
        "about": "Microsoft is hosting a hiring event for cloud engineers...",
        "Criteria": `
            **You should register for this contest if:**
            - Experience in cloud architecture and DevOps practices.
            
            **Preferred skills:**
            - Expertise in Azure, Kubernetes, CI/CD pipelines.
        `,
        "reviews": "8.4k",
        "ratings": "39k",
        "Industry": "Tech",
        "CompanyType": "Public"
    },
    {
        "logo": "https://example.com/logo3.png",
        "coverPhoto": "https://example.com/coverPhoto3.png",
        "companyName": "Amazon",
        "title": "AWS Solutions Architect Hiring Event",
        "tags": ["AWS", "Cloud", "Architecture", "DevOps"],
        "time": "1:00 PM - 4:00 PM",
        "date": "2024-11-15",
        "enrolled": "6.2k",
        "about": "Join Amazon’s AWS team for a hiring event...",
        "Criteria": `
            **You should register for this contest if:**
            - Experience in designing cloud solutions using AWS services.
            
            **Preferred skills:**
            - Hands-on experience with AWS services such as EC2, S3, Lambda.
        `,
        "reviews": "9.5k",
        "ratings": "50k",
        "Industry": "Tech",
        "CompanyType": "Public"
    },
    {
        "logo": "https://example.com/logo4.png",
        "coverPhoto": "https://example.com/coverPhoto4.png",
        "companyName": "Facebook",
        "title": "Frontend Developer Hiring Challenge",
        "tags": ["React", "JavaScript", "CSS", "Frontend"],
        "time": "11:00 AM - 2:00 PM",
        "date": "2024-10-25",
        "enrolled": "4.3k",
        "about": "Facebook is searching for top frontend developers...",
        "Criteria": `
            **You should register for this contest if:**
            - Strong proficiency in React and modern frontend development.

            **Preferred skills:**
            - Experience with responsive design and building UI components.
        `,
        "reviews": "12.3k",
        "ratings": "42k",
        "Industry": "Tech",
        "CompanyType": "Public"
    },
    {
        "logo": "https://example.com/logo5.png",
        "coverPhoto": "https://example.com/coverPhoto5.png",
        "companyName": "Apple",
        "title": "iOS Developer Hiring Challenge",
        "tags": ["Swift", "iOS", "Mobile Development", "Xcode"],
        "time": "2:00 PM - 5:00 PM",
        "date": "2024-11-12",
        "enrolled": "7.5k",
        "about": "Apple is looking for talented iOS developers...",
        "Criteria": `
            **You should register for this contest if:**
            - Experience in developing apps using Swift for iOS.

            **Preferred skills:**
            - Knowledge of Apple's Human Interface Guidelines and proficiency in Xcode.
        `,
        "reviews": "9.8k",
        "ratings": "38k",
        "Industry": "Tech",
        "CompanyType": "Public"
    },
    {
        "logo": "https://example.com/logo6.png",
        "coverPhoto": "https://example.com/coverPhoto6.png",
        "companyName": "Netflix",
        "title": "Backend Developer Hiring Event",
        "tags": ["Node.js", "Microservices", "API Development"],
        "time": "3:00 PM - 6:00 PM",
        "date": "2024-12-01",
        "enrolled": "5.7k",
        "about": "Netflix is hiring backend developers to join their engineering team...",
        "Criteria": `
            **You should register for this contest if:**
            - Strong background in backend development using Node.js.

            **Preferred skills:**
            - Experience with microservices architecture and API development.
        `,
        "reviews": "7.2k",
        "ratings": "32k",
        "Industry": "Entertainment",
        "CompanyType": "Public"
    },
    {
        "logo": "https://example.com/logo7.png",
        "coverPhoto": "https://example.com/coverPhoto7.png",
        "companyName": "Uber",
        "title": "DevOps Engineer Hiring Challenge",
        "tags": ["DevOps", "CI/CD", "Cloud"],
        "time": "9:00 AM - 12:00 PM",
        "date": "2024-11-20",
        "enrolled": "3.8k",
        "about": "Uber is searching for experienced DevOps engineers...",
        "Criteria": `
            **You should register for this contest if:**
            - Experience in automating deployments and managing cloud infrastructure.

            **Preferred skills:**
            - Expertise in CI/CD pipelines and cloud services like AWS or GCP.
        `,
        "reviews": "6.1k",
        "ratings": "28k",
        "Industry": "Transportation",
        "CompanyType": "Public"
    },
    {
        "logo": "https://example.com/logo8.png",
        "coverPhoto": "https://example.com/coverPhoto8.png",
        "companyName": "Tesla",
        "title": "Embedded Systems Engineer Hiring Challenge",
        "tags": ["C", "C++", "Embedded Systems"],
        "time": "1:00 PM - 4:00 PM",
        "date": "2024-12-05",
        "enrolled": "4.2k",
        "about": "Tesla is hiring embedded systems engineers for their automotive software team...",
        "Criteria": `
            **You should register for this contest if:**
            - Proficiency in C/C++ and experience in embedded systems.

            **Preferred skills:**
            - Experience in automotive software and working with microcontrollers.
        `,
        "reviews": "8.7k",
        "ratings": "37k",
        "Industry": "Automotive",
        "CompanyType": "Public"
    },
    {
        "logo": "https://example.com/logo9.png",
        "coverPhoto": "https://example.com/coverPhoto9.png",
        "companyName": "Airbnb",
        "title": "Data Scientist Hiring Event",
        "tags": ["Data Science", "Machine Learning", "Python", "R"],
        "time": "10:00 AM - 1:00 PM",
        "date": "2024-11-30",
        "enrolled": "5.5k",
        "about": "Airbnb is looking for data scientists to join their analytics team...",
        "Criteria": `
            **You should register for this contest if:**
            - Strong knowledge of machine learning algorithms and data analysis.

            **Preferred skills:**
            - Proficiency in Python, R, and experience with big data tools.
        `,
        "reviews": "10.4k",
        "ratings": "41k",
        "Industry": "Hospitality",
        "CompanyType": "Public"
    },
    {
        "logo": "https://example.com/logo10.png",
        "coverPhoto": "https://example.com/coverPhoto10.png",
        "companyName": "Spotify",
        "title": "Data Engineer Hiring Challenge",
        "tags": ["Python", "SQL", "Data Engineering", "ETL"],
        "time": "2:00 PM - 5:00 PM",
        "date": "2024-12-15",
        "enrolled": "6.8k",
        "about": "Spotify is hiring data engineers for building robust data pipelines...",
        "Criteria": `
            **You should register for this contest if:**
            - Experience in building and maintaining scalable data pipelines.

            **Preferred skills:**
            - Expertise in Python, SQL, and working with ETL processes.
        `,
        "reviews": "9.1k",
        "ratings": "36k",
        "Industry": "Music",
        "CompanyType": "Public"
    }
];


module.exports=event