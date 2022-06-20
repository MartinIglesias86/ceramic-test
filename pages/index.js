import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import { Web3Provider } from "@ethersproject/providers";
import { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import { useViewerConnection } from '@self.id/react';
import { EthereumAuthProvider } from '@self.id/web';
import { useViewerRecord } from '@self.id/react';

/* We will consider the use case of building a decentralized profile on Ceramic. This is such a common use case that Self.ID comes with 
  built in support for creating and editing your profile. We will only set a Name to your 3ID and update it, but you can extend it to include 
  all sorts of other properties like an avatar image, your social media links, a description, your age, gender, etc. */
  function RecordSetter() {
    const record = useViewerRecord("basicProfile");
    //helper function to update the name stored in our record (data on Ceramic)
    const updateRecordName = async () => {
      await record.merge({
        name: name,
      });
    };
    //state variable for 'name' that you can type out to update your record
    const [name, setName] = useState("");

    return (
      <div className={styles.content}>
        <div className={styles.mt2}>
          {record.content ? (
            <div className={styles.flexCol}>
              <span className={styles.subtitle}>Hola {record.content.name}!</span>
              <span>El nombre mostrado mas arriba fue extraído de la red de Ceramic. Puedes actualizarlo debajo</span>
            </div>
          ): (
            <span>No posees un archivo de perfil asociado a tu 3ID. Crea un perfil  básico introduciendo tu nombre debajo.</span>
          )}
        </div>
        <input type="text" placeholder='Nombre' value={name} onChange={(e) => setName(e.target.value)} className={styles.mt2} />
        <button onClick={() => updateRecordName(name)}>Actualizar</button>
      </div>
    );
  }

export default function Home() {
  const web3ModalRef = useRef();
  //getProvider will prompt the user to connect their Ethereum wallet, if is not already connected, and return a Web3Provider 
  const getProvider = async () => {
    const provider = await web3ModalRef.current.connect();
    const wrappedProvider = new Web3Provider(provider);
    return wrappedProvider;
  }
  //initialize the useViewerConnection hook, which allow us to easily connect or disconnect from the Ceramic Network
  const [connection, connect, disconnect] = useViewerConnection();
  //initialize the Web3Modal
  useEffect(() => {
    if (connection.status !== "connected") {
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
    }
  }, [connection.status]);
  //connect to 3ID
  const connectToSelfID = async () => {
    const ethereumAuthProvider = await getEthereumAuthProvider();
    connect(ethereumAuthProvider);
  };
  /* create a new instance of the 'EthereumAuthProvider'. We are passing 'wrappedProvider.provider' instead of 'wrappedProvider' directly 
  because 'ethers' abstracts away the low level provider calls with helper functions so it's easier for developers to use, but since 
  not everyone uses 'ethers.js', Self.ID maintains a generic interface to actual provider specification, instead of the ethers wrapped 
  version. We can access the actual provider instance through the provider property on 'wrappedProvider'. 'connectToSelfID' takes this
  Ethereum Auth Provider, and calls the 'connect' function that we got from the 'useViewerConnection' hook which takes care of everything 
  else for us. */ 
  const getEthereumAuthProvider = async () => {
    const wrappedProvider = await getProvider();
    const signer = wrappedProvider.getSigner();
    const address = await signer.getAddress();
    return new EthereumAuthProvider(wrappedProvider.provider, address);
  };

  return (
    <div className={styles.main}>
      <div className={styles.navbar}>
        <span className={styles.title}>Ceramic Demo</span>
        {connection.status === "connected" ? (
          <span className={styles.subtitle}>Conexión exitosa</span>
        ):(
          <button onClick={connectToSelfID} className={styles.button} disabled={connection.status === "connecting"}>Conectar</button>
        )}
      </div>
      <div className={styles.content}>
        <div className={styles.connection}>
          {connection.status === "connected" ? (
            <div>
              <span className={styles.subtitle}>Tu 3ID es {connection.selfID.id}</span>
              <RecordSetter />
            </div>
          ):(
            <span className={styles.subtitle}>Conecta tu wallet para acceder a tu 3ID</span>
          )}
        </div>
      </div>
    </div>
  )
}
