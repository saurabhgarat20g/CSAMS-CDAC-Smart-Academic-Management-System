# 🚀 CDAC Management Portal - Setup Guide

If you are running this project for the first time on a new machine, please follow these steps carefully to resolve any errors.

## 1. Prerequisites
Ensure you have the following installed:
- **JDK 17**: Required for the backend. Check with `java -version`.
- **Node.js**: Required for the frontend.
- **MySQL Server**: Required for the database.
- **IDE (VS Code / IntelliJ)**: Recommended for development.

---

## 2. Backend Setup (Spring Boot)

### 🚨 THE LOMBOK FIX (Fixes 90% of Errors)
If your teammate sees errors like `The method get... is undefined` or `Constructor... is undefined`, they **MUST** install the Lombok plugin.

#### **For VS Code (Recommended):**
1. Search for the extension **"Lombok Annotations Support for VS Code"** (by Gabriel Oliveira).
2. Install it.
3. **Crucial:** After installing, press `Ctrl + Shift + P`, type **"Java: Clean Language Server Workspace"**, and click it. Then restart VS Code.

#### **For IntelliJ IDEA:**
1. Go to `File` -> `Settings` -> `Plugins`.
2. Search for **"Lombok"** and install/enable it.
3. Go to `Settings` -> `Build, Execution, Deployment` -> `Compiler` -> `Annotation Processors`.
4. Check the box **"Enable annotation processing"**.
5. Restart IntelliJ.

#### **For Eclipse:**
1. Locate the `lombok.jar` file (check your Maven repository or download from [projectlombok.org](https://projectlombok.org/download)).
2. Run the jar: `java -jar lombok.jar`.
3. In the installer window, click **"Specify location..."** and select your `eclipse.exe`.
4. Click **"Install / Update"**.
5. **Restart Eclipse**.
6. Clean your project: `Project` -> `Clean...`.

### 🗄️ Database Setup
1. Open your MySQL client (Workbench or CLI).
2. Create the database: `CREATE DATABASE cdac_db;`.
3. Import the initial schema: Run the script located at `backend/cdac_management_portal.sql`.
4. Update `backend/src/main/resources/application.properties` with **your** local MySQL username and password.

### 🔐 SSL Certificate (HTTPS)
The project is configured to run on **HTTPS**.
1. When you first run the backend, go to `https://localhost:8080/` in your browser.
2. You will see a "Your connection is not private" warning. 
3. Click **"Advanced"** and then **"Proceed to localhost (unsafe)"**. This is required for the frontend to communicate with the backend.

---

## 3. Frontend Setup (React + Vite)

1. Open a terminal in the `frontend` folder.
2. Run `npm install` to download all dependencies.
3. Once installed, run `npm run dev` to start the frontend.

---

## 4. Running the Application
1. **Start Backend**: Run the `BackendApplication.java` from your IDE or use `./mvnw spring-boot:run` in the `backend` folder.
2. **Start Frontend**: Run `npm run dev` in the `frontend` folder.
3. Access the app at `https://localhost:5173`.

---

## Common Error Fixes
- **"Java: Package not found"**: Run `mvn clean install` in the `backend` folder to download Maven dependencies.
- **"Port 8080 already in use"**: Kill the process running on 8080 or change `server.port` in `application.properties`.
- **"CORS Error"**: Ensure you have accepted the SSL certificate for `https://localhost:8080` in your browser as mentioned in Step 2.
