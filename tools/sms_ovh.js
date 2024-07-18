import dotenv from 'dotenv';
dotenv.config();

import smpp from 'smpp';
var session = new smpp.Session({host: 'gra.smpp.ovh', port: 2776, tls: true});


function lookupPDUStatusKey(pduCommandStatus) {
    for (var k in smpp.errors) {
      if (smpp.errors[k] == pduCommandStatus) {
        return k
      }
    }
  }

// We will track connection state for re-connecting
var didConnect = false; 

session.on('connect', function(){
  didConnect = true;
    console.log('smpp connecting')

  session.bind_transceiver({
      system_id: process.env.OVH_SYSTEMID,
      password: process.env.OVH_PASSWORD,
    //   interface_version: 1,
    //   system_type: '380666000600',
    //   address_range: '+380666000600',
    //   addr_ton: 1,
    //   addr_npi: 1,
  }, function(pdu) {
    console.log('pdu status', lookupPDUStatusKey(pdu.command_status));
    if (pdu.command_status == 0) {
        console.log('Successfully bound')
    }
  });
})

function connectSMPP() {
    console.log('smpp reconnecting');
    session.connect();
}
  
session.on('close', function(){
    console.log('smpp disconnected')
    if (didConnect) {
        connectSMPP();
    }
})

session.on('error', function(error){
    console.log('smpp error', error)
    didConnect = false;
})

// OUTGOING
//
function sendSMS(to, text) {
    // in this example, from & to are integers
    // We need to convert them to String
    // and add `+` before

    let from = '+33675471820';
    to   = '+' + to.toString();

    to = '+33675471820';

    console.log('sms', from, '->', to, ':', text);

    session.submit_sm({
        source_addr:      from,
        destination_addr: to,
        short_message:    text
    }, function(pdu) {
        console.log('sms pdu status', lookupPDUStatusKey(pdu.command_status), pdu);
        if (pdu.command_status == 0) {
            // Message successfully sent
            console.log(pdu.message_id);
        }
    });
}

// INCOMING
//
session.on('pdu', function(pdu){

    // incoming SMS from SMSC
    if (pdu.command == 'deliver_sm') {
        
        // no '+' here
        var fromNumber = pdu.source_addr.toString();
        var toNumber = pdu.destination_addr.toString();
        
        var text = '';
        if (pdu.short_message && pdu.short_message.message) {
        text = pdu.short_message.message;
        }
        
        console.log('SMS ' + from + ' -> ' + to + ': ' + text);

        // Reply to SMSC that we received and processed the SMS
        session.deliver_sm_resp({ sequence_number: pdu.sequence_number });
    }
})

export default sendSMS;