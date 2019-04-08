const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const path = require('path')

const sqlite = require('sqlite')
const dbConnection = sqlite.open(path.resolve(__dirname, 'banco.sqlite'), { Promise })

const port = process.env.PORT || 3000

app.use('/admin', (req, res, next) => {
    if (req.hostname === 'localhost') {
        next()
    } else {
        res.send('Not Allowed')
    }
})

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'public')))
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', async(req, res) => {
    const db = await dbConnection
    const categoriasDB = await db.all('select * from categorias;')
    const vagas = await db.all('select * from vagas;')
    const categorias = categoriasDB.map(cat => {
        return {
            ...cat,
            vagas: vagas.filter(vaga => vaga.categoria === cat.id)
        }
    })
    res.render('home',{
        categorias
    })
})

app.get('/vaga/:id', async (req, res) => {
    const db = await dbConnection
    const vaga = await db.get(`select * from vagas where id = ${req.params.id}`)
    res.render('vaga', {
        vaga
    })
})

app.get('/admin', (req, res) => {
    res.render('admin/home')
})

app.get('/admin/vagas', async(req, res) => {
    const db = await dbConnection
    const vagas = await db.all('select * from vagas;')
    res.render('admin/vagas', {
        vagas
    })
})
app.get('/admin/vaga/delete/:id', async(req,res) => {
    const db = await dbConnection
    await db.run(`delete from vagas where id = ${req.params.id}`)
    res.redirect('/admin/vagas')
})

app.get('/admin/vagas/nova', async(req, res) => {
    const db = await dbConnection
    const categorias = await db.all('select * from categorias;')
    res.render('admin/nova-vaga', { categorias })
})
app.post('/admin/vagas/nova', async(req, res) => {
    const db = await dbConnection
    const { titulo, descricao, categoria} = req.body
    await db.run(`insert into vagas (categoria, titulo, descricao) values (${categoria}, '${titulo}', '${descricao}')`)
    res.redirect('/admin/vagas')
})
app.get('/admin/vaga/editar/:id', async(req, res) => {
    const db = await dbConnection
    const categorias = await db.all('select * from categorias;')
    const vaga = await db.get(`select * from vagas where id = ${req.params.id}`)
    res.render('admin/editar-vaga', { categorias, vaga })
})
app.post('/admin/vaga/editar/:id', async(req, res) => {
    const db = await dbConnection
    const { titulo, descricao, categoria} = req.body
    const { id } = req.params
    await db.run(`update vagas set categoria = ${categoria}, titulo = '${titulo}', descricao = '${descricao}' where id = ${id}`)
    res.redirect('/admin/vagas')
})
app.get('/admin/categorias', (req, res) => {
    res.render('admin/categorias')
})

const init = async() => {
    const db = await dbConnection
    await db.run('create table if not exists categorias (id INTEGER PRIMARY KEY, categoria TEXT);')
    await db.run('create table if not exists vagas (id INTEGER PRIMARY KEY, categoria INTEGER, titulo TEXT, descricao TEXT);')
    //const categoria = 'Marketing Team';
    //await db.run(`insert into categorias (categoria) values ('${categoria}')`)
    // const titulo = 'Social Media'
    // const descricao = 'Administrar o Facebook e Instagram da empresa.'
    // await db.run(`insert into vagas (categoria, titulo, descricao) values (2, '${titulo}', '${descricao}')`)
}
init();
app.listen(port, err => {
    if(err) {
        console.log('Não foi possível iniciar o servidor do Jobify')
    } else {
        console.log('Servidor do Jobify rodando')
    }
})