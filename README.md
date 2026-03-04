# Voke: AI-Powered Career Accelerator 🚀 (AWS Hackathon Edition)

Voke is a comprehensive, AI-driven career development platform designed to empower candidates through personalized interview practice, resume analysis, and career roadmap generation. Built with a focus on **cloud-native scalability and state-of-the-art Generative AI**, Voke leverages the power of **Amazon Web Services (AWS)** to deliver a seamless and intelligent user experience.

## 🌟 Key Features

-   **Voice-Enabled AI Interviewer**: Engage in natural, real-time technical and behavioral interviews.
-   **Video Analysis & Feedback**: Record your responses and receive "brutally honest" feedback on delivery, body language, and content.
-   **ATS-Optimized Resume Analysis**: Upload your resume for a FAANG-level critique and deep-dive ATS scoring.
-   **Adaptive Career Roadmap**: Receive a personalized 3-month roadmap based on your current skill gaps and market demand.
-   **Real-time Coding Environment**: Solve technical challenges while the AI interviewer provides Socratic guidance.

## 🏗️ AWS Cloud Architecture

Voke is built on an AWS-first architecture, utilizing world-class services to handle complex AI workloads and secure data storage.

### 🧠 Amazon Bedrock (The Brain)
We utilize **Amazon Bedrock** as the primary orchestration layer for our Generative AI features, providing secure access to top-tier foundation models.
-   **Models Used**: `Llama 3.3 70B Instruct`, `Claude 3.5 Sonnet`.
-   **Applications**:
    -   **Resume Critique**: FAANG-expert analysis of candidate backgrounds.
    -   **Interview Evaluation**: Comprehensive scoring using the **6Q Personality Framework** (IQ, EQ, CQ, AQ, SQ, MQ).
    -   **Predictive Market Analysis**: Analyzing job trends to generate adaptive career guidance.

### 📁 Amazon S3 (Scalable Storage)
Security and durability are paramount for candidate data.
-   **Video Interviews**: All recorded sessions are stored securely in **Amazon S3** buckets.
-   **Resume Storage**: PDF and Docx resumes are managed via S3 with granular access controls.
-   **Signed URLs**: We use AWS-style signed URLs to ensure time-limited, secure access to private media files.

### 🛠️ AWS SDK Integration
Consistent use of the **AWS SDK for JavaScript/Deno** ensures high-performance, low-latency communication between our edge-computed services and AWS infrastructure.

## 🚀 Tech Stack

-   **Frontend**: React, TypeScript, Vite, Tailwind CSS, Framer Motion.
-   **Backend**: Supabase (Edge Functions, Auth, Database).
-   **AI Infrastructure**: Amazon Bedrock, Groq (Whisper).
-   **Storage**: Amazon S3.

## 🛠️ Setup & Installation

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/EditHive/Voke_AWS.git
    cd Voke_AWS
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Variables**:
    Create a `.env` file in the root directory:
    ```env
    VITE_GROQ_API_KEY=your_key
    VITE_GITHUB_TOKEN=your_token
    # AWS Credentials for Edge Functions
    AWS_ACCESS_KEY_ID=your_aws_key
    AWS_SECRET_ACCESS_KEY=your_aws_secret
    AWS_REGION=us-east-1
    ```

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```

## 📜 6Q Personality Framework
Voke introduces a unique evaluation metric beyond just code:
-   **IQ (Intelligence)**: Logic and precision.
-   **EQ (Emotional)**: Self-awareness and tone.
-   **CQ (Creativity)**: Innovation and "What if" thinking.
-   **AQ (Adversity)**: Resilience under pressure.
-   **SQ (Social)**: Communication and engagement.
-   **MQ (Moral)**: Integrity and transparency.

---

*Built for the AWS Hackathon 2025.*
