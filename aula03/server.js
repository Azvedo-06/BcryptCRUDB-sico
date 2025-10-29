const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const multer = require('multer');
const cors = require('cors');

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

app.use(cors());

app.get('/', (req,res) => {
    res.send(('Servidor de upload funcionando'));
});
app.listen(port, ()=> {
    console.log(`Servidor esta rodando na porta: ${port}`);
});

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
app.post('/upload', (req, res) => {
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