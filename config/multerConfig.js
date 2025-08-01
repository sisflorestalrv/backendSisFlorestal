const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- 1. CONFIGURAÇÃO PARA FOTOS DE PERFIL ---
const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Caminho estático para fotos de perfil
        const dir = 'public/uploads/perfis';
        // Cria o diretório se ele não existir
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // A mesma lógica de nome de arquivo único que você já usa
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Filtro específico para imagens de perfil
const imageFileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/pjpeg') {
        cb(null, true);
    } else {
        cb(new Error('Formato de imagem inválido. Use apenas JPEG ou PNG.'), false);
    }
};

const profileUpload = multer({
    storage: profileStorage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Limite de 5MB para fotos de perfil
});


// --- 2. CONFIGURAÇÃO PARA A GALERIA DE IMÓVEIS (SEU CÓDIGO ORIGINAL) ---
const galleryStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const { imovelId, folderName } = req.params;
        // Validação para garantir que os parâmetros existem
        if (!imovelId || !folderName) {
            return cb(new Error("ID do imóvel e nome da pasta são obrigatórios para este upload."));
        }
        const dir = `public/uploads/imovel_${imovelId}/${folderName}`;
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Filtro de arquivos genérico que você já usa
const genericFileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/pjpeg', 'image/png', 'image/gif', 'application/pdf', 'video/mp4', 'video/quicktime'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de arquivo inválido.'), false);
    }
};

const galleryUpload = multer({
    storage: galleryStorage,
    fileFilter: genericFileFilter,
    limits: { fileSize: 100 * 1024 * 1024 } // Seu limite de 100MB
});


// --- 3. EXPORTA AMBAS AS CONFIGURAÇÕES ---
module.exports = {
    profileUpload,
    galleryUpload
};