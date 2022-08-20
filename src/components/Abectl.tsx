import { Text, View, Button, useEventHandler, LineEdit, PlainTextEdit, Image } from "@nodegui/react-nodegui";
import { QPushButtonSignals, QIcon, AspectRatioMode } from "@nodegui/nodegui";
import React, { useState } from "react";
import shell from "shelljs";
import 'dotenv/config';
import child_process from "child_process";

import largeLogo from "../../assets/rect_logo.png";
import topBar from "../../assets/navbar.jpg";

import touchId from "../../assets/touch-id.png";
const touchIdIcon = new QIcon(touchId);

import send from "../../assets/send.png";
const sendIcon = new QIcon(send);

import receive from "../../assets/receive.png";
const receiveIcon = new QIcon(receive);

//console.log(process.env);
const { ABECTL, PASSPHRASE } = process.env;

let passphrase = "";
let recipient = "";
let amount = 0;

const recipientRef = React.createRef();

export function Abectl() {

  let [balance, setBalance] = useState("null");

  let [unlocked, setUnlocked] = useState(false);
  let [error, setError] = useState("");

  let [address, setAddress] = useState("");

  let [success, setSuccess] = useState("");
  let [txn, setTxn] = useState("");

  let [sending, setSending] = useState(false);
  let [receiving, setReceiving] = useState(false);

  const balanceHandler = useEventHandler<QPushButtonSignals>(
    {
      clicked: () => {
        getBalance();
      }
    },
    []
  );

  function getBalance() {
    const child = shell.exec(
      ABECTL!.concat("getbalancesabe"),
      { async: true });

    child.stdout!.on('data', function (data: string) {
      let json = JSON.parse(data);
      setBalance(json.total_balance?.toString());
    });
  }

  const passphraseHandler = (textValue: string) => {
    passphrase = textValue;
    //console.log(passphrase);
  };

  const unlockHandler = useEventHandler<QPushButtonSignals>(
    {
      clicked: () => {
        setError("");

        const child = shell.exec(
          ABECTL!.concat("walletpassphrase ").concat(passphrase).concat(" 300"),
          { async: true });

        child.on!('close', function (code) {
          if (code == 0) {
            setUnlocked(true);
            timeout();
          }
        });

        child.stderr!.on('data', function (data) {
          setError(data);
        });

        getBalance();

      }
    },
    []
  );

  const biometricHandler = useEventHandler<QPushButtonSignals>(
    {
      clicked: () => {
        setError("");

        if (child_process.execSync("sudo echo hello").toString().startsWith("hello")) {
          passphrase = PASSPHRASE!;

          const child = shell.exec(
            ABECTL!.concat("walletpassphrase ").concat(passphrase).concat(" 300"),
            { async: true });

          child.on!('close', function (code) {
            if (code == 0) {
              setUnlocked(true);
              timeout();
            }
          });

          child.stderr!.on('data', function (data) {
            setError(data);
          });
        }

        getBalance();

      }
    },
    []
  );

  function timeout() {
    setTimeout(() => {
      setUnlocked(false);
    }, 300000)
  }

  const generateHandler = useEventHandler<QPushButtonSignals>(
    {
      clicked: () => {
        setAddress(child_process.execSync(ABECTL!.concat("generateaddressabe")).toString());
      }
    },
    []
  );

  const recipientHandler = () => {
    const ref: any = recipientRef.current;
    recipient = ref.toPlainText();
  };

  const amountHandler = (textValue: string) => {
    amount = parseInt(textValue) * 10000000;
  };

  const transferHandler = useEventHandler<QPushButtonSignals>(
    {
      clicked: () => {
        setSuccess("");

        const child = shell.exec(
          ABECTL!.concat(`sendtoaddressesabe '[{"address":"${recipient}","amount":${amount.toString()}}]'`),
          { async: true });

        child.on!('close', function (code) {
          if (code == 0) {
            setSuccess("Transfer success!");
          } else {
            setSuccess("Transfer failed");
          }
        });

        child.stdout!.on('data', function (data) {
          setTxn(data);
        });
      }
    },
    []
  );
  const sendHandler = useEventHandler<QPushButtonSignals>(
    {
      clicked: () => {
        setSending(true);

        getBalance();
      }
    },
    []
  );

  const receiveHandler = useEventHandler<QPushButtonSignals>(
    {
      clicked: () => {
        setReceiving(true);
      }
    },
    []
  ); const closeHandler = useEventHandler<QPushButtonSignals>(
    {
      clicked: () => {
        setSending(false)
        setReceiving(false);

        getBalance();
      }
    },
    []
  );

  function Login() {
    return (<View>
      <Text>{`<center><img src=${largeLogo} width=300></center>`}</Text>
      <Text />
      <LineEdit style={editStyle} on={{ textChanged: passphraseHandler }} placeholderText={`private passphrase`} echoMode={2} />
      {/* <Text style={textStyle}>{error}</Text> */}
      <View style={containerStyle}>
        <Button style={btnStyle} on={unlockHandler} text={"Passphrase unlock for 5 minutes"} />
        <Button icon={touchIdIcon} style={btnStyle} on={biometricHandler} text={"TouchID unlock for 5 minutes"} />
      </View>
    </View>
    )
  }

  function TopBar() {
    return (
      <Text>{`<img src=${topBar} width=400>`}</Text>
    )
  }

  function Homepage() {
    return (<View>
      <TopBar />
      <Text>{`<br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>`}</Text>
      <Text style={largeFont}>{`<center><h1>${balance} <sub>$ABE</sub></h1></center><br/><br/>`}</Text>
      {/* <Button style={btnStyle} on={balanceHandler} text={`Get Balance: ${balance}`}></Button> */}
      <View style={rowStyle}>
        <View>
          <Button icon={sendIcon} style={iconStyle} on={sendHandler} />
          <Text>{`<center>SEND</center>`}</Text>
        </View><View>
          <Button icon={receiveIcon} style={iconStyle} on={receiveHandler} />
          <Text>{`<center>RECEIVE</center>`}</Text>
        </View>
      </View>
    </View>
    )
  }

  function Receive() {
    return (<View>
      <TopBar />
      <Text>{`<br/><br/>`}</Text>
      <Button style={btnStyle} on={generateHandler} text={"Generate new address"}></Button>
      <Text />
      <Text style={textStyle}>{`<h3>Generated address:<h3>`}</Text>
      <PlainTextEdit style={plainTextStyle} text={address} readOnly={true} />
      <Button style={btnStyle} on={closeHandler} text={"Back"}></Button>
    </View>)
  }

  function Send() {
    return (<View>
      <TopBar />
      <Text/>
      <Text style={largeFont}>{`<center><h1>${balance} <sub>$ABE</sub></h1></center>`}</Text>
      <Text />
      <Text style={textStyle}>{`<h3>Transfer to:<h3>`}</Text>
      <PlainTextEdit style={plainTextStyle} on={{ textChanged: recipientHandler }} ref={recipientRef} />
      <LineEdit style={editStyle} on={{ textChanged: amountHandler }} placeholderText={`amount in $ABE`} />
      <LineEdit style={editStyle} placeholderText={`OTP`} />
      <View style={rowStyle}>
      <Button style={rowBtnStyle} on={transferHandler} text={"Transfer"} />
      <Button style={rowBtnStyle} on={closeHandler} text={"Back"}></Button>
      </View>
      <Text style={textStyle}>{`<center>${success}</center>`}</Text>
    </ View>)
  }



  return (
    <>{unlocked ? <>{sending ? <Send /> : <>{receiving ? <Receive /> : <Homepage />}</>}</> : <View style={containerStyle}><Login /></View>}</>
  );
}

const containerStyle = `
  flex: 1;
  justify-content: 'space-around';
`;

const textStyle = `
  margin-horizontal: 30px;
  height: 30px;
`;

const largeFont = `
  font-size: 15px;
`;

const editStyle = `
  margin-horizontal: 30px;
  height: 30px;
`;

const plainTextStyle = `
margin-horizontal: 30px;
height: 300px;
`;

const btnStyle = `
  margin-horizontal: 30px;
  height: 40px;
  font-size: 14px;
  icon-size: 28px;
`;

const rowBtnStyle = `
  height: 40px;
  font-size: 14px;
  icon-size: 28px;
  padding-horizontal: 5px;
`;


const iconStyle = `
  border: none !important;
  background: none !important;
  margin-horizontal: 30px;
  height: 45px;
  font-size: 14px;
  icon-size: 40px;
`;

const rowStyle = `
  flex-direction: row;
  justify-content: space-evenly;
  margin-horizontal: 20px;
`;
