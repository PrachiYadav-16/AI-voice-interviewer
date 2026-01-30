# 🎤 IntervU - Your AI-Powered Interview Partner

Hey there! Welcome to **IntervU** - your personal AI interview coach that helps you practice and ace your next job interview. Whether you're preparing for a frontend role, data science position, or an MBA interview, we've got you covered!

## ✨ What Makes IntervU Special?

IntervU is not just another interview prep tool. It's a complete voice-based interview platform where you can:

- 🎯 **Practice Real Interviews**: Have actual voice conversations with an AI interviewer
- 🎨 **Choose Your Role**: Pick from 20+ different job roles across tech, business, and design
- 📝 **Get Live Transcripts**: See your conversation in real-time as you speak
- 🤖 **Smart AI Questions**: The AI asks role-specific questions based on your chosen position
- 💼 **Upload Your Resume**: Personalize your profile with your actual resume
- 🎭 **Custom Avatars**: Choose from fun avatars or upload your own photo

## 🚀 Getting Started

### What You'll Need

Before we dive in, make sure you have:
- Node.js (version 16 or higher)
- A Vapi AI account (don't worry, it's free to start!)
- About 5 minutes to set everything up

### Step 1: Clone This Project

Open your terminal and run:

```bash
git clone https://github.com/PrachiYadav-16/AI-voice-interviewer.git
cd AI-voice-interviewer
```

### Step 2: Install Everything

Just run this command and grab a coffee while the magic happens:

```bash
npm install
```

### Step 3: Get Your API Key

1. Head over to [Vapi Dashboard](https://dashboard.vapi.ai)
2. Sign up (it's quick and free!)
3. Create a new API key
4. Copy that key - you'll need it in a sec

### Step 4: Set Up Your Environment

Create a file called `.env.local` in your project root and add:

```env
NEXT_PUBLIC_VAPI_API_KEY=your_actual_api_key_here
```

Replace `your_actual_api_key_here` with the key you just copied.

### Step 5: Fire It Up!

Run the development server:

```bash
npm run dev
```

Now open [http://localhost:3000](http://localhost:3000) in your browser and boom! 🎉

## 🎨 Cool Features Explained

### Beautiful Landing Page
When you first log in, you'll see a gorgeous purple gradient hero section with an animated robot. We've put a lot of love into making it look professional and fun at the same time!

### 20+ Job Roles to Practice With

We've got interviews for:

**Engineering & Tech:**
- Frontend Developer (React, Vue, Angular)
- Backend Developer (APIs, Databases)
- Full Stack Developer
- Mobile Developer (iOS, Android)
- DevOps Engineer
- Cloud Architect
- Security Engineer
- QA Engineer

**Data & AI:**
- Data Analyst
- Data Scientist
- Machine Learning Engineer

**Product & Business:**
- Product Manager
- Business Analyst
- Scrum Master

**MBA Roles:**
- General Management
- Marketing
- Finance
- HR Specialist

**Design:**
- UI/UX Designer
- Graphic Designer

### Smart AI Interviewer

Our AI doesn't just ask random questions. It actually understands your role and asks relevant questions like:
- For Frontend: "Tell me about your experience with React hooks"
- For Data Science: "How would you handle missing data in a dataset?"
- For Product Manager: "Describe how you prioritize features"

Pretty cool, right?

## 🛠️ Tech Stack (For The Nerds)

We built this with some awesome technologies:

- **Next.js 14**: The React framework that makes everything fast
- **TypeScript**: Because we like our code type-safe
- **Tailwind CSS**: For those beautiful purple gradients
- **Vapi AI**: The voice engine that powers our AI interviews
- **Lucide React**: Beautiful icons throughout the app

## 📁 How It's Organized

```
IntervU/
├── app/
│   ├── components/          # All our UI components
│   │   ├── AuthPage.tsx     # Login/Signup page
│   │   ├── HomePage.tsx     # Main landing page
│   │   ├── Interview.tsx    # The interview experience
│   │   ├── JobRoleCard.tsx  # Individual role cards
│   │   └── ...
│   ├── context/             # React context for state
│   └── page.tsx             # Main entry point
├── types/                   # TypeScript type definitions
├── lib/                     # Utility functions
└── public/                  # Static files
```

## 🎯 How to Use IntervU

1. **Sign Up**: Create your account with name, email, password
2. **Pick an Avatar**: Choose from our collection or upload your photo
3. **Upload Resume**: This helps personalize your experience
4. **Choose Your Role**: Pick the job you're interviewing for
5. **Start Talking**: Click that mic button and start your interview
6. **Review Transcript**: See everything you said in real-time

## 🎨 Customization Options

Want to make it your own? Here's what you can tweak:

### Colors
All our colors are in `tailwind.config.ts`. Change the purple to blue, or go wild with your brand colors!

### Interview Questions
The AI prompts are in `app/components/Interview.tsx`. Customize them to match your interview style.

### Job Roles
Add more roles in `types/jobRoles.ts`. We made it super easy to extend!

## 🐛 Troubleshooting

**Microphone not working?**
- Check browser permissions (look for that mic icon in your address bar)
- Make sure you're using HTTPS (required for mic access)
- Try a different browser

**API errors?**
- Double-check your API key in `.env.local`
- Make sure you have credits in your Vapi account
- Check the browser console for detailed error messages

**Interview not starting?**
- Verify your internet connection
- Check if the dev server is still running
- Look for any red errors in the terminal

## 🚀 Deploying to Production

Ready to share this with the world?

### Deploy to Vercel (Easiest Way)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Add your `NEXT_PUBLIC_VAPI_API_KEY` in environment variables
5. Hit deploy and you're live!

### Other Platforms

IntervU works great on:
- Netlify
- AWS Amplify
- Railway
- Any platform that supports Next.js

## 💡 Pro Tips

- **Use Headphones**: Better audio quality = better experience
- **Find a Quiet Space**: The AI works best without background noise
- **Take Your Time**: There's no rush - think before you answer
- **Be Natural**: Talk like you would in a real interview

## 🤝 Contributing

Found a bug? Have a cool feature idea? We'd love to hear from you!

1. Fork the repository
2. Create your feature branch (`git checkout -b cool-new-feature`)
3. Commit your changes (`git commit -m 'Added something awesome'`)
4. Push to the branch (`git push origin cool-new-feature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the MIT License. Feel free to use it, modify it, and make it your own!

## 🙏 Acknowledgments

- Huge thanks to the Vapi AI team for their awesome voice API
- Next.js team for making React development so smooth
- Everyone who's tested and given feedback

## 💬 Need Help?

Got questions? Running into issues? Feel free to:
- Open an issue on GitHub
- Check out the [Vapi Documentation](https://docs.vapi.ai)
- Review the [Next.js Docs](https://nextjs.org/docs)

---

**Built with ❤️ by developers who've been through way too many interviews ourselves**

Happy interviewing! May your answers be confident and your pauses minimal. 🎤✨


