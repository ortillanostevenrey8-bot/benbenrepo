# Knowledge Announcement

This React app stores announcements and knowledge entries in Cloud Firestore.

## Connect Firebase

1. In the [Firebase Console](https://console.firebase.google.com/), open the `knowledge-announcement` project.
2. Confirm the Firebase web-app configuration in `src/pages/firebase/firebase.js` matches that project.
3. In Firebase Console, open **Build > Firestore Database**, create a database, and choose a location.
4. Start the app with `npm start`. The app creates the `announcements` and `knowledge` collections when the first entry is added.

## Document RAG and official website search

The Knowledge panel preserves its source-linked official website index in `src/Services/walastikWebsiteSearch.js` and also sends questions to WALASTIK AI. WALASTIK AI retrieves relevant chunks from uploaded PDF, TXT, Markdown, and CSV documents, then uses Gemini with Google Search grounding to answer general questions and attach web citations. Walastik-specific claims should be supported by official Walastik pages or uploaded documents; the AI must say when those sources do not verify a claim. Document source filenames and page or section names are included when available. Retrieval from uploaded documents currently uses keyword matching; vector embeddings and semantic vector search are not implemented.

Administrators can upload documents in the Knowledge panel. Files are stored privately under `walastik-documents/` in Firebase Storage. Cloud Functions extract text, split it into overlapping chunks, and store a private keyword index in Firestore. Files are limited to 10 MB and extracted text to 750,000 characters per document. Firestore rules allow authenticated users to read document metadata, but only administrators can upload; browser clients cannot read the indexed chunks, delete document records, or delete Storage objects. Callable Functions independently check the administrator's Firestore user profile before indexing or deleting.

## Deploy document RAG

No deployment or production data changes are performed automatically. Before deploying, review `firestore.rules`, `storage.rules`, and `firebase.json` for the target Firebase project. Deploying the rules changes production access policy, so confirm those changes with the project owner first.

1. Install the Cloud Function dependencies and run its checks:

   ```powershell
   npm install --prefix functions
   npm --prefix functions run check
   npm --prefix functions run test
   ```

2. Create or rotate a Gemini API key in Google AI Studio and configure it as a Firebase Functions secret. The key must not be added to React code or frontend environment variables. If a key has been shared in chat or another public place, revoke it and use a newly generated key:

   ```powershell
   firebase login
   firebase functions:secrets:set GEMINI_API_KEY --project knowledge-announcement
   ```

3. After reviewing and approving the deployment, deploy the Cloud Functions, Storage rules, and Firestore rules:

   ```powershell
   firebase deploy --only functions,storage,firestore:rules --project knowledge-announcement
   ```

This deploys the existing account-deletion function along with the document processing, deletion, and Gemini callables. Cloud Functions and Secret Manager generally require the Firebase project to use the Blaze billing plan. Firebase Storage and Firestore are subject to their current usage quotas and pricing; Gemini API access may have free-tier quotas, but usage beyond the applicable limits can be billed through the configured Google AI account. Review the current Google Cloud, Firebase, and Gemini pricing and quotas before enabling this in production.

For a later WALASTIK AI search-only update after rotating the secret, deploy just the changed callable and frontend (no Storage or Firestore rules changes):

   ```powershell
   firebase deploy --only functions:askWalastikAI,hosting --project knowledge-announcement
   ```

After deployment, sign in with an administrator account, upload a small test document, wait for its status to show **Indexed**, and ask a question answered by that document. Verify that the answer cites the correct filename and section. Do not deploy the rules or functions to production until the owner approves it.

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
