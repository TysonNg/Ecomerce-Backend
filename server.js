const app = require("./api");

const PORT = process.env.PORT || 3055

const server = app.listen(PORT, () => {
    console.log(`WSV eComerce start with port ${PORT}`);
    
})

process.on('SIGINT', (err) =>{
    server.close(() => {
        console.log(`Exit Server Express`);
    })
    process.exit();
})