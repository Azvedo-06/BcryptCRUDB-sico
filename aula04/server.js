const express = require("express");
const app = express();
const port = 3000;
const bcrypt = require("bcryptjs");
const cors = require("cors");
const userModel = require("./models/userModel");

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send(`Api is running on port ${port}`);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !password)
    return res.status(400).json({ error: "nome e senha requiridos" });

  if (userModel.getUserName(name)) {
    return res.status(400).json({ error: "Username já existe" });
  }

  const saltRounds = 10;

  try {
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const newUser = userModel.addUser({ name, email, passwordHash });
    res.status(201).json({
      message: "Usuário registrado com sucesso",
      userId: newUser.id,
      name: newUser.name,
      email: newUser.email,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/users", (req, res) => {
  try {
    const users = userModel.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/users/:id", (req, res) => {
  const userId = parseInt(req.params.id, 10);
  try {
    const user = userModel.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
