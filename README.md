# Knowledge Announcement

This React app stores announcements and knowledge entries in Cloud Firestore.

## Connect Firebase

1. In the [Firebase Console](https://console.firebase.google.com/), open the `knowledge-announcement` project.
2. Check that the Firebase web-app configuration in `src/pages/firebase/firebase.js` matches that project. These web-app values are public identifiers, not Gemini secrets.
3. In Firebase Console, open **Build > Firestore Database**, create a database, and choose a location.
4. Start the app with `npm start`. The app creates the `announcements` and `knowledge` collections when the first entry is added.

## GitHub Pages

Push changes to the `main` branch to build and deploy the site with the GitHub Actions workflow. The repository's `homepage` setting configures asset URLs for the `/benbenrepo/` project path.

For Firebase Authentication to work on the deployed site, add `ortillanostevenrey8-bot.github.io` to **Authentication > Settings > Authorized domains** in Firebase Console. Deploy the Firestore rules in `firestore.rules` before allowing users to access the database.

The AI assistant calls a Firebase callable function. Its Gemini key is stored as a Firebase Functions secret and is never included in the website bundle. The AI does not read a Gemini key or model from `.env`; do not add a Gemini key to `.env`, `.env.local`, or GitHub Actions variables.

The Firebase web configuration is safe to include in a browser bundle, but Firestore security rules still protect the data. For a private internal app while testing, use:

```
rules_version = '2';
service cloud.firestore {
	match /databases/{database}/documents {
		match /{document=**} {
			allow read, write: if false;
		}
	}
}
```

This denies all browser access, so use authenticated rules before deploying. Do not use `allow read, write: if true` in production.

## Deploy Firebase Functions

The WALASTIK AI function requires a Gemini API key stored as a Firebase secret. From this project directory, sign in to the Firebase CLI, select the `knowledge-announcement` project, save the key when prompted, and deploy the function:

```powershell
firebase login
firebase use knowledge-announcement
firebase functions:secrets:set GEMINI_API_KEY
npm install --prefix functions
firebase deploy --only functions:askWalastikAI
```

`firebase functions:secrets:set` prompts for the key; do not paste it into a source file or commit it. Cloud Functions may require the Firebase project to use the Blaze billing plan. The callable requires a signed-in user.

Deleting another user's account also requires the Firebase Admin SDK and must run on the server. Deploy that callable from this project directory:

```powershell
firebase deploy --only functions:deleteUserAccount
```

The callable verifies the signed-in administrator, deletes the target's Authentication account, and cleans up their user profile, username index, and profile picture. Deploy this function before using **Delete account** in the admin user list.

## Publish the website

The GitHub Pages workflow builds from the `main` branch. After deploying the AI function, commit and push the updated website source to `main`, then confirm the **Deploy React App to GitHub Pages** workflow completes successfully. Reload the site after deployment; if the old “Gemini API key is missing” message remains, the old frontend bundle is still being served.

## Available Scripts

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
