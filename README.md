# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Running the Project Locally

Once you have downloaded the project folder, follow these steps to run the application on your local machine:

1.  **Prerequisites**:
    *   Ensure you have [Node.js](https://nodejs.org/) installed (which includes npm, the Node Package Manager). Version 18.x or later is recommended for Next.js projects.
    *   You can verify your installation by opening a terminal or command prompt and typing:
        ```bash
        node -v
        npm -v
        ```

2.  **Navigate to Project Directory**:
    *   Open your terminal or command prompt.
    *   Use the `cd` command to navigate into the root directory of the project you downloaded. For example:
        ```bash
        cd path/to/your/project-folder
        ```

3.  **Install Dependencies**:
    *   In the project's root directory (where the `package.json` file is located), run the following command to install all the necessary packages listed in `package.json`:
        ```bash
        npm install
        ```
        (If you prefer using Yarn, you can run `yarn install` instead, assuming Yarn is installed.)

4.  **Run the Development Server**:
    *   Once the dependencies are installed, you can start the Next.js development server by running:
        ```bash
        npm run dev
        ```
    *   This command will typically start the application on `http://localhost:9002` (as specified in your `package.json` "dev" script). Open this URL in your web browser to see your application.

5.  **Run Genkit Development Server (for AI features)**:
    *   If your application uses Genkit for AI functionality, you'll likely need to run the Genkit development server in a separate terminal. Navigate to your project's root directory and run:
        ```bash
        npm run genkit:dev
        ```
    *   This will start the Genkit development tools, often on a different port (e.g., `http://localhost:4000`), allowing your Next.js app to communicate with your Genkit flows.

Now you should have your application running locally! Any changes you make to the code will typically hot-reload in the browser.

## Deploying to a Live URL

To make your application accessible via a live, public URL, you typically deploy it using Firebase Hosting.

For a Next.js application, the general steps involve:
1. Setting up Firebase Hosting in your Firebase project.
2. Configuring your project for deployment (often involves settings in `firebase.json`).
3. Using the Firebase CLI (Command Line Interface) to deploy your application:
   ```bash
   # Install Firebase CLI if you haven't already
   npm install -g firebase-tools
   # Login to Firebase
   firebase login
   # Initialize Firebase in your project (if not already done)
   firebase init hosting
   # Or, if using a framework like Next.js with App Hosting integration:
   # firebase init apphosting
   # Deploy your application
   firebase deploy
   ```
After a successful deployment, the Firebase CLI will provide you with the live URL(s) for your application.

Please refer to the official Firebase Hosting documentation for detailed, up-to-date instructions. Firebase Studio might also offer integrated deployment options.

## Downloading Your Project Folder

Most development environments like Firebase Studio provide an option to download your entire project as a folder (e.g., as a ZIP file). Look for an "Export," "Download Project," or similar option in the Firebase Studio interface (often in a File menu, project settings, or toolbar). This allows you to get a local copy of your application code.
