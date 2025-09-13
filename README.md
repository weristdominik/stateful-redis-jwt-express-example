# 🛡️ Keep Sessions Alive Across Pods — Stateful Authentication with JWT + Redis

This project demonstrates how to build a **stateful session-based authentication system** in a **Kubernetes** environment using:

- 🔐 **JWT (JSON Web Tokens)**
- 🧠 **Redis** as a centralized session store
- 🚀 **Node.js + Express** web server
- ☸️ **Minikube** for local Kubernetes cluster

> ✅ Designed to maintain user sessions even if pods are restarted or scaled.

---

# 📖 Full Explanation & Tutorial

📚 **Read the full blog post on Medium:**

👉 [Keep Sessions Alive Across Pods — Stateful (JWT + Redis)](https://medium.com/@dominikrottmann/keep-sessions-alive-across-pods-stateful-authentication-with-jwt-redis-0b0e3aeaa858)

---

## 📁 Project Structure

```bash
.
├── kubernetes
│   ├── app-deployment.yaml
│   └── redis-deployment.yaml
├── README.md
└── src
    ├── Dockerfile
    ├── index.js
    ├── package.json
    └── views
        └── login.html
```

---

## 🛠️ Getting Started (Local Setup with Minikube)

```bash
# Switch to Minikube's Docker environment
eval $(minikube docker-env)

# Build the app Docker image
cd src
docker build -t node-redis-app:latest .

# Start Minikube
minikube start

# Deploy Redis and the Node.js app
kubectl apply -f ../kubernetes/redis-deployment.yaml
kubectl apply -f ../kubernetes/app-deployment.yaml

# Get service URL
minikube service --url node-app
```
