import http from 'http';
import aidememore from './formatAM.js';
import fetch from "node-fetch";

const server = http.createServer(async (req, res) => {
    console.log('client up and running')
    let urlstate = req.url.split('=')
    var clientSection = urlstate[1]
    var clientTokenSection = urlstate[2]
    var companyTokenSection = urlstate[3]
    var endPoint 
    var endPointToken
    var resultToken
    var clientToken
    var companyToken

    if(clientSection) {
        var clientid = clientSection.slice(0, clientSection.indexOf('&'))
        var GetclientToken = clientTokenSection.slice(0, clientTokenSection.indexOf('&'))
        var GetcompanyToken = companyTokenSection.slice(0, companyTokenSection.indexOf('&')) 
        endPoint = `http://localhost:8900/api/ClientToken/${clientid}`
            endPointToken = await fetch(endPoint)
            resultToken = await endPointToken.json()
            clientToken = resultToken[0].ClientGUID
        endPoint = `http://localhost:8900/api/CompanyToken/${clientid}`
            endPointToken = await fetch(endPoint)
            resultToken = await endPointToken.json()
            companyToken = resultToken[0].Variable
    }

    if(clientid && clientToken == GetclientToken && companyToken == GetcompanyToken){
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
