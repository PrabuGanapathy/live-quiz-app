# Live Quiz App 🎯

A **host-driven live quiz web app** (similar to Kahoot/Slido) built with plain HTML, CSS, and JavaScript, powered by Google Firebase Firestore for real-time syncing across devices. Deploy directly to GitHub Pages with **zero build tools**.

## Features

✅ **No Login Required** - Players just enter their name and group  
✅ **Real-Time Syncing** - All players see the same question instantly via Firestore  
✅ **Time-Based Scoring** - 500-1000 points based on speed (instant = 1000, full timeout = 500)  
✅ **Host-Controlled** - Admin controls when questions start, answers reveal, and quiz ends  
✅ **Mobile-First Design** - Works seamlessly on phones, tablets, and desktops  
✅ **Live Leaderboard** - Real-time rankings and group progress tracking  
✅ **CSV & PDF Reports** - Export full quiz data for analysis  
✅ **15 Sample Questions** - Ready-to-use insurance/financial MCQs included  
✅ **Customizable** - Create your own questions and groups per quiz run  

## Folder Structure

```
live-quiz-app/
├── index.html              # Player join page
├── play.html               # Player quiz play screen
├── host.html               # Admin/host console
├── css/
│   └── style.css           # All styling (responsive, Kahoot colors)
├── js/
│   ├── firebase-config.js  # Firebase setup & admin credentials
│   ├── common.js           # Shared utilities & helpers
│   ├── join.js             # Player join logic
│   ├── play.js             # Player gameplay logic
│   └── host.js             # Host/admin logic
├── data/
│   └── sample-questions.json # 15 sample MCQ questions
└── README.md               # This file
```

## Quick Start (5 minutes)

### Step 1: Create a Firebase Project

1. Go to **https://console.firebase.google.com/**
2. Click **"Create a project"** (or "Add project")
3. Enter a project name (e.g., "Live Quiz App") → **Continue**
4. Disable Google Analytics (optional) → **Create project**
5. Wait for the project to be created

### Step 2: Get Firebase Config Keys

1. In Firebase Console, click the **"</> icon"** ("Add app")
2. Select **"Web"** and register the app with a nickname
3. Firebase will show you a config object. Copy these 6 values:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

### Step 3: Enable Firestore Database

1. In Firebase Console, go to **"Firestore Database"** (left sidebar)
2. Click **"Create database"**
3. Select **"Start in test mode"** (for development)
4. Choose your preferred region → **Enable**
5. Firestore is now ready!

### Step 4: Configure the App

1. Open **`js/firebase-config.js`** in this repo
2. Replace the placeholder config with your Firebase keys:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```
3. Set your own **admin PIN and password** (any values you want):
   ```javascript
   const ADMIN_PIN = "1234";          // Change this
   const ADMIN_PASSWORD = "admin123"; // Change this
   ```
4. **Commit and push** these changes to GitHub

### Step 5: Enable GitHub Pages

1. Go to your repo **Settings → Pages**
2. Under **Source**, select **"Deploy from a branch"**
3. Select **Branch: main** and folder **/ (root)**
4. Click **Save**
5. GitHub will show you a link like `https://yourusername.github.io/live-quiz-app/`
6. Your app is live! 🚀

## How to Use

### For Admin/Host

1. Open **`host.html`** on your device (e.g., your laptop)
2. Enter your admin PIN and password → **LOGIN**
3. Click **"+ New"** to create a new quiz run
4. Enter:
   - Quiz name
   - 3-10 group names (e.g., Team A, Team B, Team C)
   - Choose: Use 15 sample questions OR add your own
5. Click **"Create Run"** → Admin will show you a 6-character **run code** (e.g., `AB3XQ9`)
6. Share this code with players (or the full link: `https://yourusername.github.io/live-quiz-app/index.html?run=AB3XQ9`)
7. In **Live Control Panel**:
   - Click **"NEXT QUESTION"** to start each question
   - Click **"REVEAL ANSWER"** to show the correct answer and fastest 3 responders
   - Click **"END QUIZ"** after the last question
8. View live **leaderboard**, **group progress**, and **fastest responses** in the right panel
9. Export **CSV or PDF reports** with all player scores and question difficulty stats

### For Players

1. Open **`index.html`** on their phone/tablet/computer
2. Enter their **name** and select their **group**
3. Enter the **run code** (from the admin) OR click a shareable link
4. Click **"JOIN QUIZ"**
5. Wait in the lobby for the host to start
6. When a question appears:
   - Read the question
   - Tap one of the 4 color-coded answer buttons
   - Watch the countdown timer (gold ring)
7. After answering, see:
   - ✓ Correct/✗ Wrong feedback
   - Points earned this round
   - Running total score
   - Badge if top 3 fastest
   - Top 5 live leaderboard
8. When the quiz ends, see the **final score** and full leaderboard

## Scoring Rules

- **Correct answer**: 500–1000 points (linear scale based on speed)
  - Answered instantly (0s) = 1000 points
  - Answered at buzzer (full timeout) = 500 points
- **Wrong answer or no answer**: 0 points
- **Final score** = sum of all question points
- **Accuracy** = (correct answers / total questions) × 100%

## Question Format

All questions are **Multiple Choice (MCQ)** with:
- Question text
- 4 answer options (color-coded: blue, pink, green, orange)
- 1 correct answer
- Configurable time limit per question (default 30 seconds)

## Firestore Data Model

The app stores data in this structure:

```
runs/{runCode}
  ├── name: string
  ├── groups: [string]
  ├── status: "lobby" | "live" | "closed"
  ├── currentQuestionIndex: number
  ├── revealedIndex: number
  ├── numQuestions: number
  ├── createdAt: timestamp
  ├── questions/{index}
  │   ├── text: string
  │   ├── options: [string, string, string, string]
  │   ├── correctIndex: number (0-3)
  │   └── timeLimit: number (seconds)
  ├── players/{playerId}
  │   ├── name: string
  │   ├── group: string
  │   ├── totalScore: number
  │   ├── totalCorrect: number
  │   ├── totalAnswered: number
  │   └── joinedAt: timestamp
  ├── responses/{autoId}
  │   ├── playerId: string
  │   ├── playerName: string
  │   ├── group: string
  │   ├── qIndex: number
  │   ├── selectedIndex: number (or null)
  │   ├── correct: boolean
  │   ├── timeTakenMs: number
  │   ├── points: number
  │   └── answeredAt: timestamp
  └── questionStats/{index}
      ├── totalResponses: number
      ├── totalCorrect: number
      ├── groupStats: { [group]: { total, correct } }
      └── fastestThree: [ { playerId, playerName, timeTakenMs } ]
```

## Security & Limitations

⚠️ **Important for Production:**

- **Test Mode Warning**: This app is configured for Firebase **test mode** (public read/write). Before going live with real data, replace test rules with secure production rules:
  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /runs/{runCode} {
        allow read, write: if request.auth != null;
      }
    }
  }
  ```
  Or implement authentication (email, Google Sign-In, etc.).

- **Capacity**: Firebase free tier supports ~150–250 concurrent players per quiz. For larger events, upgrade to Blaze pricing.

- **No Player Authentication**: Players don't log in; anyone with the run code can join. For privacy, use shorter session times or implement sign-in.

- **Admin Credentials**: The admin PIN and password are stored in `firebase-config.js`. For higher security, use Firebase Authentication instead.

## Customization

### Change Admin PIN/Password

Open `js/firebase-config.js`:
```javascript
const ADMIN_PIN = "9999";          // Your new PIN
const ADMIN_PASSWORD = "mypassword"; // Your new password
```

### Change Color Palette

Edit `css/style.css` to replace the Kahoot colors:
```css
/* Current colors */
#FFBB00   /* Amber/Gold */
#111111   /* Black */
#ffffff   /* White */
#2E7DD8   /* Blue (option 1) */
#E63946   /* Pink/Red (option 2) */
#06A77D   /* Green (option 3) */
#FF9F1C   /* Orange (option 4) */
```

### Add Your Own Questions

In the admin console:
1. Click **"+ New"** to create a quiz run
2. Select **"Add Questions Manually"**
3. Fill in each question's text, 4 options, correct answer, and time limit
4. Click **"Create Run"**

## Troubleshooting

### "Run not found" error
- Check the run code is correct (6 characters, case-insensitive)
- Ensure the admin has created the run and it's not closed

### Questions not appearing for players
- Admin must click **"NEXT QUESTION"** to start each question
- Check that the run status is "live" (not "lobby" or "closed")

### Firestore errors (permission denied)
- Verify Firestore is in **test mode** or has correct security rules
- Check Firebase config keys are correct in `firebase-config.js`
- Ensure the browser console shows no errors (F12 → Console)

### Timer ring not animating
- Check browser compatibility (modern browsers: Chrome, Safari, Firefox, Edge)
- Verify JavaScript is enabled

### CSV/PDF export not working
- Ensure browser allows downloads
- Check file size (very large reports may timeout)

## Browser Support

✅ Chrome (latest)  
✅ Safari (latest)  
✅ Firefox (latest)  
✅ Edge (latest)  
✅ Mobile browsers (iOS Safari, Chrome Android)  

## Known Limitations

- **No offline mode**: Players must have internet to join and play
- **Firestore limits**: Max ~150-250 concurrent players on free tier
- **Time zone**: All timestamps are in UTC (configurable in host.js if needed)
- **Unanswered questions**: Players who don't answer get 0 points
- **No question banks**: Questions are per-run; not reusable across quizzes (can be added)
- **No team mode**: Scoring is individual; no team pooling (can be added)

## Support & Contributing

For issues, questions, or feature requests, please open a GitHub issue.

## License

MIT License - feel free to use, modify, and distribute.

---

**Ready to run your first quiz?**

1. ✅ Firebase project created
2. ✅ Config keys added to `firebase-config.js`
3. ✅ GitHub Pages enabled
4. ✅ Admin PIN & password set
5. 🎯 Open `host.html` to create your first quiz!

Good luck! 🚀
