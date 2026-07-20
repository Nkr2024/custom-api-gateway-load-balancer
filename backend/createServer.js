import express from "express";

export function createBackendServer(serverName, port) {
  const app = express();

  app.use(express.json());

  const products = [
    { id: 1, name: "Laptop" },
    { id: 2, name: "Phone" },
    { id: 3, name: "Keyboard" }
  ];

  const users = [
    { id: 1, name: "Nilesh" },
    { id: 2, name: "Aman" },
    { id: 3, name: "Ravi" }
  ];

  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      server: serverName,
      uptime: process.uptime()
    });
  });

  app.get("/api/products", async (req, res) => {
    const delay = Number(req.query.delay) || 500;

    await sleep(delay);

    res.status(200).json({
      server: serverName,
      route: "/api/products",
      processingTime: `${delay}ms`,
      data: products
    });
  });

  app.post("/api/products", (req, res) => {
    const product = {
      id: products.length + 1,
      name: req.body.name
    };

    products.push(product);

    res.status(201).json({
      server: serverName,
      message: "Product created",
      data: product
    });
  });

  app.get("/api/users", async (req, res) => {
    const delay = Number(req.query.delay) || 300;

    await sleep(delay);

    res.status(200).json({
      server: serverName,
      route: "/api/users",
      processingTime: `${delay}ms`,
      data: users
    });
  });

  app.listen(port, () => {
    console.log(`${serverName} running on port ${port}`);
  });
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}