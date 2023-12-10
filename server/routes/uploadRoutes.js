const express = require('express');
const fileUpload = require('express-fileupload');

const fs = require('fs');
const path = require('path');

// Modelos a usar
const Usuario = require('../models/usuarioModel');
const Producto = require('../models/productoModel');

const app = express();

app.use(fileUpload({
    useTempFiles: true
}));

app.put('/upload/:tipo/:id', (req, res) => {

    // Obtener el tipo y el id de los parametros obligatorios
    let tipo = req.params.tipo;
    let id = req.params.id;
    
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400)
            .json({
                ok: false,
                err: {
                    message: 'No han sido subido archivos'
                }
            })
    }

    // Validar tipos
    let tiposValidos = ['productos', 'usuarios'];
    if(tiposValidos.indexOf(tipo) < 0){
        return res.status(400).json({
            ok: false,
            err: {
                message: 'Los tipos permitidos son ' + tiposValidos.join(','),
            }
        })
    }


    // El nombre del campo file es archivo
    let archivo = req.files.archivo;
    let nombreCortado = archivo.name.split('.');
    let extension = nombreCortado[nombreCortado.length - 1];
    
    // Extensiones permitidas
    let extensionesValidas = ['png','jpg','gif','jpeg']


    if(extensionesValidas.indexOf(extension) < 0 ){
        return res.status(400).json({
            ok: false,
            err:{
                message: 'Las extensiones permitidas son ' + extensionesValidas.join(', '),
                ext: extension
            }
        })
    }

    // Cambiar nombre del archivo
    let nombreArchivo = `${id}-${(new Date().getMilliseconds())}.${extension}`

    archivo.mv(`uploads/${tipo}/${nombreArchivo}`, (err) => {
        if (err)
            return res.status(500)
            .json({
                ok: false,
                err
            });

        // res.json({
        //     ok: true,
        //     message: 'Archivo subido'
        // })
        if(tipo === 'usuarios'){
            imagenUsuario(id, res, nombreArchivo);
        }
        if(tipo === 'productos'){
            imagenProducto(id, res, nombreArchivo)
        }
    });
})

// ===================================================================
//	           Funcion para subir las imagenes de los usuarios                                                    
// ===================================================================

function imagenUsuario(id, res, nombreArchivo){
    Usuario.findById(id, (err, usuarioDB)=> {
        if(err){

            borrarArchivo(nombreArchivo, 'usuarios')

            return res.status(500)
            .json({
                ok: false,
                err
            });
        }

        if(!usuarioDB){

            borrarArchivo(nombreArchivo, 'usuarios')

            return res.status(400)
            .json({
                ok: false,
                err: {
                    message: 'El usuario no existe'
                }
            })
        }

        borrarArchivo(usuarioDB.img, 'usuarios')
        
        usuarioDB.img = nombreArchivo;

        usuarioDB.save((err, usuarioGuardado)=>{
            res.json({
                ok: true,
                usuario: usuarioGuardado,
                img: nombreArchivo
            })
        })

    })
}

// ===================================================================
//	           Funcion para subir las imagenes de los productos                                                    
// ===================================================================

function imagenProducto(id, res, nombreArchivo){
    Producto.findById(id, (err, productoDB) => {
        if(err){
            borrarArchivo(nombreArchivo, 'productos');

            return res.status(500).json({
                ok: false,
                err
            })
        }

        if(!productoDB){
            borrarArchivo(nombreArchivo, 'productos');

            return res.status(400).json({
                ok: false,
                err: {
                    message: 'El producto no existe'
                }
            })
        }

        borrarArchivo(productoDB.img, 'productos');

        productoDB.img = nombreArchivo;

        productoDB.save((err, productoGuardado)=>{
            res.json({
                ok: true,
                producto: productoGuardado,
                img: nombreArchivo
            })
        })
    })
}

function borrarArchivo(nombreImagen, tipo){
    let pathImage = path.resolve(__dirname, `../../uploads/${tipo}/${nombreImagen}`)
    if(fs.existsSync(pathImage)){
        fs.unlinkSync(pathImage);
    }
}

module.exports = app;