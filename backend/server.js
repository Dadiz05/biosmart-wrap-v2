const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

const mockDB = {
  "123": {
    name: "Cá hồi",
    supplier: "ABC Farm",
    packDate: "2026-04-01",
  },
  "456": {
    name: "Thịt bò",
    supplier: "XYZ Meat",
    packDate: "2026-04-02",
  },
};

app.get("/product/:id", (req, res) => {
  const product = mockDB[req.params.id];

  if (!product) {
    return res.status(404).json({ error: "Not found" });
  }

  res.json(product);
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});