const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define onde os arquivos serão armazenados
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Cria um caminho dinâmico: public/uploads/imovel_ID/pasta/
    const { imovelId, folderName } = req.params;
    const dir = `public/uploads/imovel_${imovelId}/${folderName}`;

    // Cria o diretório se ele não existir
    fs.mkdirSync(dir, { recursive: true });
    
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Garante que o nome do arquivo seja único para evitar sobrescrever
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Mantém a extensão original do arquivo
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtro de arquivos mais genérico
const fileFilter = (req, file, cb) => {
  // Lista de tipos de arquivo permitidos
  const allowedMimes = [
    'image/jpeg',
    'image/pjpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'video/mp4',
    'video/quicktime' // Para vídeos .mov
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true); // Aceita o arquivo
  } else {
    // Rejeita o arquivo com um erro específico
    cb(new Error('Tipo de arquivo inválido. Apenas imagens, PDFs e vídeos são permitidos.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // Aumentado o limite para 20MB para vídeos
  },
  fileFilter: fileFilter
});

module.exports = upload;