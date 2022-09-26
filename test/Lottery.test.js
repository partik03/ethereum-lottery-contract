const assert = require('assert');
const ganache = require('ganache-cli');
// const { beforeEach, describe, it } = require('mocha');
const Web3 = require("web3");
const web3 = new Web3(ganache.provider());

const { interface, bytecode } = require('../compile');
let accounts,lottery;

beforeEach(async ()=>{
    accounts = await web3.eth.getAccounts();
    lottery = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({data:bytecode})
    .send({from:accounts[0],gas :'1000000'});
    // console.log("Lottery",lottery);
});

describe('Lottery Contract', ()=>{
    it('deploys a contract',()=>{
        assert.ok(lottery.options.address);
    });
    it("allow one to enter ",async()=>{
        await lottery.methods.enter().send({
            from:accounts[0],
            value:web3.utils.toWei('0.02','ether'),
        })
        const players = await lottery.methods.getPlayers().call({
            from:accounts[0],
        })
        assert.equal(accounts[0],players[0]);
        assert.equal(1,players.length);
    })


    it("allow multiple to enter ",async()=>{
        await lottery.methods.enter().send({
            from:accounts[0],
            value:web3.utils.toWei('0.02','ether'),
        })
        await lottery.methods.enter().send({
            from:accounts[1],
            value:web3.utils.toWei('0.02','ether'),
        })
        await lottery.methods.enter().send({
            from:accounts[2],
            value:web3.utils.toWei('0.02','ether'),
        })
        const players = await lottery.methods.getPlayers().call({
            from:accounts[0],
        })
        assert.equal(accounts[0],players[0]);
        assert.equal(accounts[1],players[1]);
        assert.equal(accounts[2],players[2]);
        assert.equal(3,players.length);
    })
    it("require minimum amount of eth to participate",async()=>{
        try {
            await lottery.methods.enter().send({
                from:accounts[0],
                value:0,
            })
            assert(false);
        } catch (error) {
            assert(error);
        }
    })
    it("only manager can pick a winner",async()=>{
        try {
            await lottery.methods.pickWinner().send({
                from:accounts[1],
            })
        } catch (error) {
            assert(error);
        }
    })
    it("send money to the winner and reset the players array",async ()=>{
        await lottery.methods.enter().send({
            from:accounts[0],
            value: web3.utils.toWei('2','ether'),
        });
        const intialBalance = await web3.eth.getBalance(accounts[0]);
        await lottery.methods.pickWinner().send({from:accounts[0]});
        const finalBalance = await web3.eth.getBalance(accounts[0]);
        assert(finalBalance - intialBalance > web3.utils.toWei('1.8','ether'));
        
    })
})