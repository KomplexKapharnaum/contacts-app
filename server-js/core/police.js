var police = {};

// Log info about queries
//

police.queryMemory = {};
police.addToQuery = (ip, uuid) => {
    police.queryMemory[uuid] = {
        requests: 0,
        ips: [ip]
    };
}

police.updateQuery = (uuid, ip) => {
    if (police.queryMemory[uuid]) {
        police.queryMemory[uuid].requests++;
        if (police.queryMemory[uuid].ips.indexOf(ip) == -1) police.queryMemory[uuid].ips.push(ip);
    } else {
        police.addToQuery(ip, uuid);
    }

    // console.log(police.queryMemory[uuid]);
}

export default police;