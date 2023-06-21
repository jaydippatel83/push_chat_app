import logo from "./logo.svg";
import "./App.css";
import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import Box from "@material-ui/core/Box";
import Divider from "@material-ui/core/Divider";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import Avatar from "@material-ui/core/Avatar";
import Fab from "@material-ui/core/Fab";
import SendIcon from "@material-ui/icons/Send";
import * as PushAPI from "@pushprotocol/restapi";
import { ethers } from "ethers";

import { createSocketConnection, EVENTS } from '@pushprotocol/socket';
import { Button } from "@material-ui/core";
 

const useStyles = makeStyles({
  table: {
  },
  chatSection: {
    width: "100%",
    height: "90vh",
    backgroundColor:'#fff',
    boxShadow: "0 1px 2px 0 rgb(145 158 171 / 24%)",
    borderRight: "1px solid #e0e0e0",
    borderLeft: "1px solid #e0e0e0", 
    borderBottom: "1px solid #e0e0e0",
    borderRadius: "16px",
  },
  headBG: {
    backgroundColor: "#e0e0e0",
  },
  borderRight500: {
    borderRight: "1px solid #e0e0e0",
  },
  messageArea: {
    height: "60vh",
    overflowY: "auto",
  },
  senderMsgBox: {
    borderRadius: "0px 15px 15px 20px",
    background: "#eee",
    padding: "10px",
  },
  recieveMsgBox: {
    borderRadius: "20px 15px 0 15px",
    background: "aliceblue",
    padding: "10px",
  },
});

function App() {
  const classes = useStyles();
  const [address, setAddress] = useState("");
  const [receiver, setReceiver] = useState("");
  const [message, setMessage] = useState("");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectUser, setSelectUser]=useState("");
  const [userChatMessages, setUserChatMessages]= useState([]);

  const shortAddress = (addr) =>
    addr.length > 10 && addr.startsWith("0x")
      ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`
      : addr;



  useEffect(() => {
    async function initWallet() {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      setProvider(provider);
      const signer = provider.getSigner();
      setSigner(signer);
      const address = await signer.getAddress();
      // const usr = await getUser(address);
      // console.log(usr, "usr");
      const list = await fetchingChats(signer, address);
      setUsers(list);
      console.log(list, "list ");
    }
    initWallet();
  }, [])


 





  const connectWallet = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum)

    // MetaMask requires requesting permission to connect users accounts
    await provider.send("eth_requestAccounts", []);
    setProvider(provider);
    const signer = provider.getSigner();
    console.log(signer, "signer");
    setSigner(signer);

    const address = await signer.getAddress();
    console.log(address, "address");
    setAddress(address);

    const usr = await getUser(address);
    if (!usr) {
      await createUser(signer);
    }
    await userChatDecryptKey(signer, address);
    const chats = await userChats(signer, address);
    console.log(chats, "chats");

    // const chatList = await userChatHistory();


  }


  async function fetchingChats(signer, address) {
    const user = await PushAPI.user.get({
      account: `eip155:${address}`,
      env: 'staging',
    }) 
    const pgpDecrpyptedPvtKey = await PushAPI.chat.decryptPGPKey({
      encryptedPGPPrivateKey: user.encryptedPrivateKey,
      signer: signer,
    }) 
    const response = await PushAPI.chat.chats({
      account: `eip155:${address}`,
      toDecrypt: true,
      pgpPrivateKey: pgpDecrpyptedPvtKey,
      env: 'staging',
    }) 
    return response;
  }

  async function createUser(signer) {

    const user = await PushAPI.user.create({
      signer: signer,
      env: 'staging',
    });

    console.log('PushAPI_user_create | Response - 200 OK');
    console.log(user);
    return user;
  }

  async function getUser(address) {
    const user = await PushAPI.user.get({
      account: `eip155:${address}`,
      env: 'staging',
    });

    console.log('PushAPI_user_get | Response - 200 OK');
    console.log(user);
    return user;
  }

  async function userChatDecryptKey(signer, address) {
    const user = await PushAPI.user.get({
      account: `eip155:${address}`,
      env: 'staging',
    });

    // decrypt the PGP Key
    const pgpKey = await PushAPI.chat.decryptPGPKey({
      encryptedPGPPrivateKey: user.encryptedPrivateKey,
      signer: signer,
    });
    console.log('PushAPI_chat_decryptPGPKey | Response - 200 OK');
    console.log(pgpKey);
  }

  async function userChats(signer, address) {
    const user = await PushAPI.user.get({
      account: `eip155:${address}`,
      env: 'staging',
    });

    // Decrypt PGP Key
    const pgpDecrpyptedPvtKey = await PushAPI.chat.decryptPGPKey({
      encryptedPGPPrivateKey: user.encryptedPrivateKey,

      signer: signer,
    });

    // Actual api
    const response = await PushAPI.chat.chats({
      account: `eip155:${address}`,
      toDecrypt: true,
      pgpPrivateKey: pgpDecrpyptedPvtKey,
      env: 'staging',
    }); 
  }

  async function userChatRequest() {
    const user = await PushAPI.user.get({
      account: `eip155:${address}`,
      env: 'staging',
    });

    // Decrypt PGP Key
    const pgpDecrpyptedPvtKey = await PushAPI.chat.decryptPGPKey({
      encryptedPGPPrivateKey: user.encryptedPrivateKey,

      signer: signer,
    });

    // Actual api
    const response = await PushAPI.chat.requests({
      account: `eip155:${address}`,
      toDecrypt: true,
      pgpPrivateKey: pgpDecrpyptedPvtKey,
      env: 'staging',
    });

    console.log('PushAPI_chat_requests | Response - 200 OK');
    console.log(response);
  }

  async function userSendChat() {

    const provider = new ethers.providers.Web3Provider(window.ethereum)
    if(!receiver) return alert("Please input Receiver address!");

    // MetaMask requires requesting permission to connect users accounts
    await provider.send("eth_requestAccounts", []);
    setProvider(provider);
    const signer = provider.getSigner();
    console.log(signer, "signer");
    setSigner(signer);

    const address = await signer.getAddress();
    // Fetch user
    const user = await PushAPI.user.get({
      account: `eip155:${address}`,
      env: 'staging',
    });

    // Decrypt PGP Key
    const pgpDecrpyptedPvtKey = await PushAPI.chat.decryptPGPKey({
      encryptedPGPPrivateKey: user.encryptedPrivateKey,

      signer: signer,
    });

    // Actual api
    const response = await PushAPI.chat.send({
      messageContent: message,
      messageType: 'Text', // can be "Text" | "Image" | "File" | "GIF"
      receiverAddress: receiver,

      signer: signer,
      pgpPrivateKey: pgpDecrpyptedPvtKey,
      env: 'staging',
    });

    console.log('PushAPI_chat_send | Response - 200 OK');

    console.log(response);
    return response.chatId;
  }

  async function userChatApproove() {
    const user = await PushAPI.user.get({
      account: `eip155:${0xfB5C5f3d07ac7551c765E0dB128738755A1a7Efe}`,
      env: 'staging',
    });

    // Decrypt PGP Key
    const pgpDecrpyptedPvtKey = await PushAPI.chat.decryptPGPKey({
      encryptedPGPPrivateKey: user.encryptedPrivateKey,

      signer: '0xfB5C5f3d07ac7551c765E0dB128738755A1a7Efe',
    });

    // Actual api
    const approve = await PushAPI.chat.approve({
      status: 'Approved',
      senderAddress: address, // receiver's address or chatId of a group

      signer: '0xfB5C5f3d07ac7551c765E0dB128738755A1a7Efe',
      pgpPrivateKey: pgpDecrpyptedPvtKey,
      env: 'staging',
    });

    console.log('PushAPI_chat_approve | Response - 200 OK');

    console.log(approve);
  }
  async function userChatConversation() {
    // conversation hash are also called link inside chat messages
    const conversationHash = await PushAPI.chat.conversationHash({
      account: `eip155:${address}`,
      conversationId: `eip155:${0xfB5C5f3d07ac7551c765E0dB128738755A1a7Efe}`, // 2nd address
      env: 'staging',
    });

    console.log('PushAPI_chat_conversationHash | Response - 200 OK');

    console.log(conversationHash);
  }

  async function userChatHistory(signer) {
    const user = await PushAPI.user.get({
      account: `eip155:${address}`,
      env: 'staging',
    });

    // Decrypt PGP Key
    const pgpDecrpyptedPvtKey = await PushAPI.chat.decryptPGPKey({
      encryptedPGPPrivateKey: user.encryptedPrivateKey,
      signer: signer,
    });

    // Fetch conversation hash
    // conversation hash are also called link inside chat messages
    const conversationHash = await PushAPI.chat.conversationHash({
      account: `eip155:${address}`,
      conversationId: `eip155:${0xfB5C5f3d07ac7551c765E0dB128738755A1a7Efe}`, // 2nd address
      env: 'staging',
    });

    // Actual API
    const response = await PushAPI.chat.history({
      threadhash: conversationHash.threadHash, // get conversation hash from conversationHash function and send the response threadhash here
      account: `eip155:${address}`,
      limit: 5,
      toDecrypt: true,
      pgpPrivateKey: pgpDecrpyptedPvtKey,
      env: 'staging',
    });

    console.log('PushAPI_chat_history | Response - 200 OK');
    console.log(response);
  }

  async function userLatestChat(recieverAdd) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []); 
    const signer = provider.getSigner();

    const address = await signer.getAddress();

    const user = await PushAPI.user.get({
      account: `eip155:${address}`,
      env: 'staging',
    });

    // Decrypt PGP Key
    const pgpDecryptedPvtKey = await PushAPI.chat.decryptPGPKey({
      encryptedPGPPrivateKey: user.encryptedPrivateKey,
      signer: signer,
    });

    // Fetch conversation hash
    // conversation hash are also called link inside chat messages
    const conversationHash = await PushAPI.chat.conversationHash({
      account: `eip155:${address}`,
      conversationId: `${recieverAdd}`, // 2nd address
      env: 'staging',
    }); 

    const chatHistory = await PushAPI.chat.history({
      threadhash: conversationHash.threadHash,
      account: `eip155:${address}`,
      limit: 20,
      toDecrypt: true,
      pgpPrivateKey: pgpDecryptedPvtKey,
      env: 'staging',
    });


    console.log('PushAPI_chat_latest | Response - 200 OK');
    console.log(chatHistory,"resp");
     setUserChatMessages(chatHistory)
  }

  async function userChatDecrypt() {
    // Fetch user
    const user = await PushAPI.user.get({
      account: `eip155:${signer.address}`,
      env: 'staging',
    });

    // Decrypt PGP Key
    const pgpDecrpyptedPvtKey = await PushAPI.chat.decryptPGPKey({
      encryptedPGPPrivateKey: user.encryptedPrivateKey,

      signer: signer,
    });

    // Fetch conversation hash
    // conversation hash are also called link inside chat messages
    const conversationHash = await PushAPI.chat.conversationHash({
      account: `eip155:${address}`,
      conversationId: `eip155:${0xfB5C5f3d07ac7551c765E0dB128738755A1a7Efe}`, // 2nd address
      env: 'staging',
    });

    // Chat History
    const encryptedChats = await PushAPI.chat.history({
      threadhash: conversationHash.threadHash, // get conversation hash from conversationHash function and send the response threadhash here
      account: `eip155:${address}`,
      limit: 5,
      toDecrypt: false,
      pgpPrivateKey: pgpDecrpyptedPvtKey,
      env: 'staging',
    });

    // Decrypted Chat
    const decryptedChat = await PushAPI.chat.decryptConversation({
      messages: encryptedChats, // array of message object fetched from chat.history method
      connectedUser: user, // user meta data object fetched from chat.get method
      pgpPrivateKey: pgpDecrpyptedPvtKey, //decrypted private key
      env: 'staging',
    });

    console.log('PushAPI_chat_decryptConversation | Response - 200 OK');

    console.log(decryptedChat);
  }

  async function PushChatSDKSocket() {
    const pushSDKSocket = createSocketConnection({
      user: `eip155:${address}`,
      socketType: 'chat',
      socketOptions: { autoConnect: true, reconnectionAttempts: 3 },
      env: 'staging',
    });

    if (!pushSDKSocket) {
      throw new Error('Socket not connected');
    }

    pushSDKSocket.on(EVENTS.CONNECT, async () => {
      console.log('Socket Connected - will disconnect after 4 seconds');

      // send a chat from other wallet to this one to see the result
      // Fetch user
      const user = await PushAPI.user.get({
        account: `eip155:${0xfB5C5f3d07ac7551c765E0dB128738755A1a7Efe}`,
        env: 'staging',
      });

      // Decrypt PGP Key
      const pgpDecrpyptedPvtKey = await PushAPI.chat.decryptPGPKey({
        encryptedPGPPrivateKey: user.encryptedPrivateKey, 
        signer: '0xfB5C5f3d07ac7551c765E0dB128738755A1a7Efe',
      });

      // Actual api
      const response = await PushAPI.chat.send({
        messageContent: "Gm gm! It's me... Jaydip patel 32",
        messageType: 'Text',
        receiverAddress: `eip155:${signer.address}`,

        signer: "0xfB5C5f3d07ac7551c765E0dB128738755A1a7Efe",
        pgpPrivateKey: pgpDecrpyptedPvtKey,
        env: 'staging',
      });
      console.log('PushAPI_chat_send | Response - 200 OK');
    });

    pushSDKSocket.on(EVENTS.DISCONNECT, () => {
      console.log('Socket Disconnected');
    });

    pushSDKSocket.on(EVENTS.CHAT_RECEIVED_MESSAGE, (message) => {
      // feedItem is the notification data when that notification was received
      console.log('Incoming Push Chat message from Socket');

      console.log(message);

      // disconnect socket after this, not to be done in real implementations
      pushSDKSocket.disconnect();
    });

    const delay = (ms) =>
      new Promise((resolve) => setTimeout(resolve, ms));
    await delay(4000);
  } 

  const selectCurrentUser= async(e)=>{
    console.log(e,"ee");
    // setSelectUser(e)
    const id = e?.wallets;
   const conversation= await userLatestChat(id)
  }

  return (
    <div className="App">
      <Grid container>
        <Grid item xs={12}>
          <Typography variant="h5" className="header-message">
            Chat
          </Typography>
          <Button variant="conained" onClick={connectWallet}>Connect Wallet</Button>
        </Grid>
      </Grid>
      <Grid container component={Paper} className={classes.chatSection}>
        <Grid item xs={3} className={classes.borderRight500}>
          <List>
            <ListItem button key="RemySharp">
              <ListItemIcon>
                <Avatar sx={{ bgcolor: "orange" }}>M</Avatar>
              </ListItemIcon>
              <ListItemText primary={shortAddress(address)} style={{border:'1px solid #eee', padding:'3px 15px', borderRadius:'20px', fontWeight:'bolder'}}></ListItemText>
            </ListItem>
          </List>
          <Divider />
          <Grid item xs={12} style={{ padding: "10px" }}>
            <TextField
              id="outlined-basic-email"
              label="Search"
              variant="outlined"
              fullWidth
            />
          </Grid>
          <Divider />
          <List>
            {
              users && users.map((usr, i) => {
                return (
                  <ListItem button key={i} onClick={()=>selectCurrentUser(usr)}>
                    <ListItemIcon>
                      <Avatar
                        alt={usr?.name}
                        src={usr?.profilePicture}
                      />
                    </ListItemIcon>
                    <ListItemText primary={shortAddress(usr?.wallets?.replace("eip155:",""))} style={{border:'1px solid #eee', padding:'3px 15px', borderRadius:'20px', fontWeight:'bolder'}}>{shortAddress(usr?.wallets?.replace("eip155:",""))}</ListItemText>
                    {/* <ListItemText secondary="online" align="right"></ListItemText> */}
                  </ListItem>
                )
              })
            }



          </List>
        </Grid>
        <ChatBox
          classes={classes}
          receiver={receiver}
          setReceiver={setReceiver}
          message={message}
          setMessage={setMessage}
          userSendChat={userSendChat}
          userChatMessages={userChatMessages}
        />
      </Grid>
    </div>
  );
}

export default App;


const ChatBox = ({ classes, receiver, setReceiver, message, setMessage, userSendChat,userChatMessages }) => {
  return (
    <Grid item xs={9}>
      <List className={classes.messageArea}>
        {
          userChatMessages && userChatMessages.map((data,i)=>{
            return (
              <ListItem key={i}>
              <Grid container>
                <Grid item xs={12}>
                  <ListItemText
                    align="right"
                    primary={data?.messageContent}
                  ></ListItemText>
                </Grid>
                <Grid item xs={12}>
                  <ListItemText align="right" secondary={Date(data?.timestamp)}></ListItemText>
                </Grid>
              </Grid>
            </ListItem>
            )
          })
        }
       
        {/* <ListItem key="2">
          <Grid container>
            <Grid item xs={12}>
              <ListItemText
                align="left"
                primary="Hey, Iam Good! What about you ?"
              ></ListItemText>
            </Grid>
            <Grid item xs={12}>
              <ListItemText align="left" secondary="09:31"></ListItemText>
            </Grid>
          </Grid>
        </ListItem>  */}
      </List>
      <Divider />
      <Grid container style={{ padding: "20px" }}>
        <Grid item xs={6}>
          <TextField
            id="outlined-basic-email"
            label="Receiver Address"
            fullWidth
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
          />
        </Grid>
      </Grid>
      <Grid container style={{ padding: "5px" }}>
        <Grid item xs={11}>
          <TextField
            id="outlined-basic-email"
            label="Message.."
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </Grid>
        <Grid xs={1} align="right">
          <Fab
            color="primary"
            aria-label="add"
            onClick={() => userSendChat()}
          >
            <SendIcon />
          </Fab>
        </Grid>
      </Grid>
    </Grid>
  );
};

