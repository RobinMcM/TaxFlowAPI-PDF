import http from 'http';
import aidememore from './formatAM.js';

const server = http.createServer(async (req, res) => {
    console.log('client up and running')
    let urlstate = req.url.split('=')
    var clientid = urlstate[1]
    if(clientid){
        const getAidememoire_0 = await aidememore(clientid, 0, 0)
        const getAidememoire_1 = await aidememore(clientid, 1, getAidememoire_0.row_count)
        const getAidememoire_2 = await aidememore(clientid, 2, getAidememoire_1.row_count)
        const data = getAidememoire_0.result + getAidememoire_1.result + getAidememoire_2.result
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(data);
    }
   res.end()
})

server.listen(5050)
