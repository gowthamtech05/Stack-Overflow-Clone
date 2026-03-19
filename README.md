# Stack Overflow Clone

## Project Overview
This project was initially developed as a training project to replicate the core functionalities of Stack Overflow using the MERN stack.

## Project Evolution
During my internship, I extended this project by implementing advanced features and real-world functionalities.

### Social Media System
- Users can create posts with images/videos
- Like, comment, and share functionality
- Friend-based posting limits:
  - 0 friends → cannot post
  - 1 friend → 1 post/day
  - 2 friends → 2 posts/day
  - 10+ friends → unlimited posts

---

### Subscription System
- Free Plan → 1 question/day
- Bronze Plan → 5 questions/day
- Silver Plan → 10 questions/day
- Gold Plan → Unlimited questions
- Razorpay integration
- Payment allowed only between **10 AM – 11 AM**
- Email invoice sent after successful payment

---

### Reward System
- +5 points for answering a question
- +5 bonus points for 5 upvotes
- Points deducted for downvotes or deleted answers
- Users can transfer points (only if >10 points)

---

### Forgot Password System
- Reset via email or phone
- Allowed only once per day
- Auto password generator:
  - Only uppercase & lowercase letters
  - No numbers or special characters

---

### Multi-Language Support
Supported languages:
- English, Spanish, Hindi, Portuguese, Chinese, French

Security:
- French → Email OTP verification
- Other languages → Mobile OTP verification

---

### Login Tracking & Security
- Tracks:
  - Browser
  - Operating System
  - Device type
  - IP address
- Rules:
  - Chrome → Email OTP required
  - Microsoft browser → Direct login
  - Mobile login → Allowed only between 10 AM – 1 PM

---


## Tech Stack
- Frontend: React.js, Vite, Tailwind CSS, React Router, Axios, i18next
- Backend: Node.js, Express.js
- Database: MongoDB, Mongoose
- Authentication: JWT, bcrypt
- Payment Integration: Razorpay
- Media Storage: Cloudinary, Multer
- Email Service: Nodemailer, Brevo (Sendinblue)
- Utilities: ua-parser-js (device/browser detection), Crypto (OTP generation), CORS, Cookie-parser 

## Live Demo
https://stack-overflow-updated.vercel.app/
