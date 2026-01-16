import express, { urlencoded } from "express"

const app = express();

app.use(urlencoded())
app.use(express.json())


app.listen()