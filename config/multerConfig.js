const multer = require('multer');
const path = require('path');

// Define onde os arquivos serão armazenados
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Os arquivos serão salvos na pasta 'public/uploads'
    // Certifique-se de que essa pasta exista!
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    // Cria um nome de arquivo único para evitar conflitos
    // Ex: 17188241_minhafoto.png
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtro para aceitar apenas arquivos de imagem
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/pjpeg', // para IE
    'image/png',
    'image/gif'
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo inválido. Apenas imagens são permitidas.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limite de 5MB por arquivo
  },
  fileFilter: fileFilter
});

module.exports = upload;