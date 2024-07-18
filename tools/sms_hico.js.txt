function encodeUCS2(str)
{
    let data = ""
    for (var i=0; i < str.length; i++)
        data += ("0000" + str.charCodeAt(i).toString(16)).slice(-4)
    return data;
}

// SEND SMS HIGHCO
import {create} from 'xmlbuilder2'
import https from 'https'

var hico = {
    "accountid" : "EUREKA",
    "password" : "zes6yt76et",
    "email" : "sms@kxkm.net"
  }

function sendSMS(dest, txt)
{
    console.log('send sms', dest, txt)
    const doc = create({version: "1.0", encoding:"UTF-8"})
        .ele('push', {
            'accountid'     : hico.accountid,
            'password'      : hico.password,
            'email'         : hico.email,
            'class_type'    : 1,
            'name'          : 'CONTACTS',
            'sender'        : 'KXKM',
            'userdata'      : 'contacts',
            'datacoding'    : '8',
            'start_date'    : '2000-01-01',
            'start_time'    : '00:00'
        })
        .dtd({sysID: 'push.dtd'} )
        .ele('message')
            // .ele('text').txt(txt).up()                               // Plain text (160 char max)
            .ele('binary', {'unicode': 1}).txt( encodeUCS2(txt) ).up()  // UCS2 encoded with emoji support (70 char max)
            for (let d of dest) doc.ele('to', { 'ret_id': 'TO_'+d }).txt(d).up()
        doc.up()

    // convert the XML tree to string
    let xml = doc.end({ prettyPrint: false })
    console.log(doc.end({ prettyPrint: true }))

    // POST
    var postData = 'xml='+encodeURIComponent(xml);
    var options = {
      protocol: 'https:',
      hostname: 'highpush-v50.hcnx.eu',
      port: 443,
      path: '/api',
      method: 'POST',
      headers: {
           'Content-Type': 'application/x-www-form-urlencoded'
         }
    };

    // return // TODO; remove me !!!

    var req = https.request(options, (res) => {
        console.log('statusCode:', res.statusCode);
        // console.log('headers:', res.headers);
        res.on('data', (d) => {
          process.stdout.write(d);
        });
      });
      
    req.on('error', (e) => {
        console.error(e);
    });
    
    req.write(postData);
    req.end();
}
////////////////////////////////////////////////:

export default sendSMS;