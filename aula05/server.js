const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const path = require('path');
const jwt = require("jsonwebtoken");
const multer = require("multer");
const {
  getUserName,
  addUser,
  getAllUsers,
  getUserById,
} = require("./models/userModel");
const { config } = require("dotenv");
config();

const app = express();
const port = 3000;

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
    return res.status(400).json({ message: "nome e senha requiridos" });

  if (getUserName(name)) {
    return res.status(404).json({ message: "Username já existe" });
  }

  const saltRounds = 10;

  try {
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const newUser = addUser({ name, email, passwordHash });
    res.status(201).json({
      message: "Usuário registrado com sucesso",
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/users", (req, res) => {
  try {
    const users = getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/users/:id", async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  try {
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({ message: "nome e senha requiridos" });
    }

    const user = await getUserName(name);

    if (!user) {
      return res.status(404).json({ message: "usuário não encontrado" });
    }

    const passwordCompare = await bcrypt.compare(password, user.passwordHash);
    if (!passwordCompare) {
      return res.status(401).json({ message: "Credencias Inválidas" });
    }

    const playload = { id: user.id, name: user.name };
    const token = jwt.sign(playload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ message: "Login realizado com sucesso", token: token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({message: 'Acesso Negado: token ausente.'})
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if(err) {
      return res.status(403).json({message: 'Token inválido ou expirado.'})
    }

    req.id = decoded.id;
    next();
  })
}


//----------- upload

// Módulo do sistema de arquivos
const fs = require('fs');
// Função para criar o diretório de uploads se não existir
const createUploadsDirectory = (dir) => {
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir,{recursive: true});
        console.log(`Diretório ${dir} criado com sucesso.`);
    }
}
// Filtro para aceitar apenas arquivos JPEG e PNG
const fileFilter = (req, file, cb) => {
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(new Error('Apenas arquivos JPEG e PNG são permitidos'), false);
    }   
}

// Tamanho máximo do arquivo em bytes
const max_file_size = 5 * 1024 * 1024; // 5MB

// Configuração do armazenamento
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'upload/';
        createUploadsDirectory(uploadDir)
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// Configuração do multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: max_file_size,
        files: 10 // Limite de 10 arquivos por upload
    }
})

// Rota para upload de arquivo 
app.post('/upload', verificarToken, (req, res) => {
    console.log(`Upload feito pelo user id: ${req.id}`);
    
    upload.array('meusArquivos', 10)(req, res, function (err) {
        // Erro do multer
        if (err instanceof multer.MulterError) {
            // Limite de tamanho excedido
            return res.status(400).send({ 
                message: `Erro do multer: ${err.code}.`,
                detail: `Verifique se o arquivo não excede o tamanho.`
            });
        }   
        // Erro desconhecido
        if (err) {
            return res.status(400).send({ 
                message: err.message
            });
        }
        // Nenhum arquivo enviado
        if (!req.files || req.files.length === 0) {
            return res.status(400).send({ 
                message: 'Nenhum arquivo foi enviado.'
            });
        }
        const nomesArquivos = req.files.map(f => f.filename);
        // Sucesso
        res.status(200).json({
            message: "Upload realizado com sucesso!",
            arquivos: nomesArquivos
        });
    });
});