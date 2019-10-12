import React, {useState, useEffect} from 'react';
import './App.scss';
import axios from 'axios';
import base64url from 'base64url';
import Zone from './assets/zone.png';
import Azure from './azure';
import AWS from './aws';
import Google from './assets/google.png'
import classNames from 'classnames';
import QRCode from 'qrcode.react';
import Modal from 'react-modal';
import {FaTimes} from 'react-icons/fa';

function App() {
  const [payAmount, setPayAmount] = useState(null);
  const [insuranceAmount, setInsuranceAmount] = useState(null);
  const [rate, setRate] = useState(null);
  const [base64data, setBase64Data] = useState(null);
  const [serviceProvider, setServiceProvider] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);

  const getBase64Data = () => {
    const data = {
      serviceProvider: serviceProvider,
      insuranceAmount: Math.floor(insuranceAmount * rate),
      payAmount: Math.floor(payAmount * rate),
      willCrash: 1,
    };

    const json_string = JSON.stringify(data);

    setBase64Data(base64url(json_string));

    console.log(data);
  }

  useEffect(() => {
    axios.get(`https://cors-anywhere.herokuapp.com/https://bb-odds.herokuapp.com/api/rates`).then(res => {
      setRate(res.data.data.GBYTE_USD * 1000000);
    });
  }, []);

  useEffect(() => {
    getBase64Data();
  });

  const openModal = () => {
    setModalIsOpen(true);
  }

  const closeModal = () => {
    setModalIsOpen(false);
  }

  const handleOptionChange = (changeEvent) => {
    setServiceProvider(changeEvent.target.value);
  };

  const handlePayChange = (changeEvent) => {
    setPayAmount(changeEvent.target.value);
  }

  const handleInsuranceChange = (changeEvent) => {
    setInsuranceAmount(changeEvent.target.value);
  }

  const className = classNames('App',
    {
      'item-is-selected': serviceProvider !== null
    }
  );

  return (
    <div className={className}>
      <div className="container">
      <Modal
          isOpen={modalIsOpen}
          onRequestClose={closeModal}
        >
          <button className="modal__button" onClick={closeModal}><FaTimes /></button>
          <h2>Scan or click QRcode</h2>
            <a href={`byteball-tn:UY4GVQ3H5DCI3QY7YJDHFAPULO3TDKYH?amount=${payAmount}&base64data=${base64data}`}>
              <QRCode size={200} value={`byteball-tn:UY4GVQ3H5DCI3QY7YJDHFAPULO3TDKYH?amount=${payAmount}&base64data=${base64data}`} />
            </a>
        </Modal>
        <div className="card">
          <h3 className="card__title">I want to insure my server on</h3>
          <div className="card__product-options">
            <label className="card__product-option">
              <input className="card__input" type="radio" name="product" value="aws" checked={serviceProvider === 'aws'} onChange={handleOptionChange} />
              <span className="checkmark"><AWS className="icon" /> <span>AWS</span></span>
            </label>
            <label className="card__product-option">
              <input className="card__input" type="radio" name="product" value="google" checked={serviceProvider === 'google'} onChange={handleOptionChange} />
              <span className="checkmark"><img className="icon icon--google" src={Google} alt="google" /> <span>Google</span></span>
            </label>
            <label className="card__product-option">
              <input className="card__input" type="radio" name="product" value="azure" checked={serviceProvider === 'azure'} onChange={handleOptionChange} />
              <span className="checkmark"><Azure className="icon icon--azure" /><span>Azure</span></span>
            </label>
            <label className="card__product-option">
              <input className="card__input" type="radio" name="product" value="zone" checked={serviceProvider === 'zone'} onChange={handleOptionChange} />
              <span className="checkmark"><img src={Zone} alt="Zone" className="icon icon--zone" /> <span>Zone</span></span>
            </label>
          </div>
        </div>
        <div className="card">
          <h3 className="card__title">For the sum of</h3>
          <div className="card__options">
            <label className="card__option">
              <input className="card__input" type="radio" name="sum1" value="50" checked={payAmount === '50'} onChange={handlePayChange} />
              <span className="checkmark checkmark--sum">50€</span>
            </label>
            <label className="card__option">
              <input className="card__input" type="radio" name="sum1" value="200" checked={payAmount === '200'} onChange={handlePayChange} />
              <span className="checkmark checkmark--sum">200€</span>
            </label>
            <label className="card__option">
              <input className="card__input" type="radio" name="sum1" value="500" checked={payAmount === '500'} onChange={handlePayChange} />
              <span className="checkmark checkmark--sum">500€</span>
            </label>
            <label className="card__option">
              <input className="card__input" type="radio" name="sum1" value="1000" checked={payAmount === '1000'} onChange={handlePayChange} />
              <span className="checkmark checkmark--sum">1000€</span>
            </label>
            <label className="card__option">
              <input className="card__input" type="radio" name="sum1" value="5000" checked={payAmount === '5000'} onChange={handlePayChange} />
              <span className="checkmark checkmark--sum">5000€</span>
            </label>
          </div>
        </div>
        <div className="card">
          <h3 className="card__title">And the price I'm willing to pay is</h3>
          <div className="card__options">
            <label className="card__option">
              <input className="card__input" type="radio" name="sum2" value="50" checked={insuranceAmount === '50'} onChange={handleInsuranceChange} />
              <span className="checkmark checkmark--sum">50€</span>
            </label>
            <label className="card__option">
              <input className="card__input" type="radio" name="sum2" value="200" checked={insuranceAmount === '200'} onChange={handleInsuranceChange} />
              <span className="checkmark checkmark--sum">200€</span>
            </label>
            <label className="card__option">
              <input className="card__input" type="radio" name="sum2" value="500" checked={insuranceAmount === '500'} onChange={handleInsuranceChange} />
              <span className="checkmark checkmark--sum">500€</span>
            </label>
            <label className="card__option">
              <input className="card__input" type="radio" name="sum2" value="1000" checked={insuranceAmount === '1000'} onChange={handleInsuranceChange} />
              <span className="checkmark checkmark--sum">1000€</span>
            </label>
            <label className="card__option">
              <input className="card__input" type="radio" name="sum2" value="5000" checked={insuranceAmount === '5000'} onChange={handleInsuranceChange} />
              <span className="checkmark checkmark--sum">5000€</span>
            </label>
          </div>
        </div>
        <div className="button-wrapper">
          <a href="#" onClick={openModal} className="button"><span>🦔</span> Hedge it</a>
        </div>
      </div>
    </div>
  );
}

export default App;
