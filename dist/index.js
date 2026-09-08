import app from "./app.js";
const PORT = process.env.PORT || 3000;
// ⚠️ VULNERABILIDADE PROPOSITAL PARA TESTE DO CODEQL — REMOVER DEPOIS
// app.get("/ping", (req, res) => {
//   const host = req.query.host;
//   exec(`ping -c 1 ${host}`, (err, stdout) => {
//     res.send(stdout);
//   });
// });
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
