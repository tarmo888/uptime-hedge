import React, {useState, useEffect} from 'react';
import './App.scss';
import axios from 'axios';
import base64url from 'base64url';
import Zone from './assets/zone.png';
import Azure from './assets/azure';
import AWS from './assets/aws';
import Google from './assets/google.png'
import classNames from 'classnames';
import QRCode from 'qrcode.react';
import Modal from 'react-modal';
import {FaTimes} from 'react-icons/fa';
import Insure from './assets/insure.png';
import Invest from './assets/invest.png';
import TakerView from './TakerView';
import Logo from './assets/logo.png';

function App() {
  const [payAmount, setPayAmount] = useState(null);
  const [insuranceAmount, setInsuranceAmount] = useState(null);
  const [rate, setRate] = useState(null);
  const [base64data, setBase64Data] = useState(null);
  const [serviceProvider, setServiceProvider] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState('insure');
  const [choiceMade, setChoiceMade] = useState(false);

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
    axios.get(`http://uptimehedge.com/api-currencies`).then(res => {
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

  const calculatePayAmount = (times = 1) => {
    return `${Number(insuranceAmount) / 10 * times}`
  }

  const onChoiceModalOptionClick = (choice) => {
    setSelectedChoice(choice);
    setChoiceMade(true);
  }

  const handleTabsChange = (changeEvent) => {
    setSelectedChoice(changeEvent.target.value);
  }

  const renderInsureContent = () => {
    return (
      <>
      <div className="card">
          <h3 className="card__title">I want to insure my server on</h3>
          <div className="card__product-options">
            <label className="card__product-option">
              <input className="card__input" type="radio" name="product" value="AWS" checked={serviceProvider === 'AWS'} onChange={handleOptionChange} />
              <span className="checkmark"><AWS className="icon" /> <span>AWS</span></span>
            </label>
            <label className="card__product-option">
              <input className="card__input" type="radio" name="product" value="googleCloud" checked={serviceProvider === 'googleCloud'} onChange={handleOptionChange} />
              <span className="checkmark"><img className="icon icon--google" src={Google} alt="googleCloud" /> <span>Google Cloud</span></span>
            </label>
            <label className="card__product-option">
              <input className="card__input" type="radio" name="product" value="azure" checked={serviceProvider === 'azure'} onChange={handleOptionChange} />
              <span className="checkmark"><Azure className="icon icon--azure" /><span>Azure</span></span>
            </label>
            <label className="card__product-option">
              <input className="card__input" type="radio" name="product" value="zone" checked={serviceProvider === 'zone'} onChange={handleOptionChange} />
              <span className="checkmark"><img src={Zone} alt="zone" className="icon icon--zone" /> <span>Zone</span></span>
            </label>
          </div>
        </div>
        <div className="card">
          <h3 className="card__title">For the sum of</h3>
          <div className="card__options">
            <label className="card__option">
              <input disabled={!serviceProvider} className="card__input" type="radio" name="sum1" value="50" checked={insuranceAmount === '50'} onChange={handleInsuranceChange} />
              <span className="checkmark checkmark--sum">50€</span>
            </label>
            <label className="card__option">
              <input disabled={!serviceProvider} className="card__input" type="radio" name="sum1" value="200" checked={insuranceAmount === '200'} onChange={handleInsuranceChange} />
              <span className="checkmark checkmark--sum">200€</span>
            </label>
            <label className="card__option">
              <input disabled={!serviceProvider} className="card__input" type="radio" name="sum1" value="500" checked={insuranceAmount === '500'} onChange={handleInsuranceChange} />
              <span className="checkmark checkmark--sum">500€</span>
            </label>
            <label className="card__option">
              <input disabled={!serviceProvider} className="card__input" type="radio" name="sum1" value="1000" checked={insuranceAmount === '1000'} onChange={handleInsuranceChange} />
              <span className="checkmark checkmark--sum">1000€</span>
            </label>
            <label className="card__option">
              <input disabled={!serviceProvider} className="card__input" type="radio" name="sum1" value="5000" checked={insuranceAmount === '5000'} onChange={handleInsuranceChange} />
              <span className="checkmark checkmark--sum">5000€</span>
            </label>
          </div>
        </div>
        <div className="card">
          <h3 className="card__title">And the price I'm willing to pay is</h3>
          <div className="card__options">
            <label className="card__option">
              <input disabled={!serviceProvider} className="card__input" type="radio" name="sum2" value={calculatePayAmount()} checked={payAmount === calculatePayAmount()} onChange={handlePayChange} />
              <span className="checkmark checkmark--sum">{`${calculatePayAmount()}€`}</span>
            </label>
            <label className="card__option">
              <input disabled={!serviceProvider} className="card__input" type="radio" name="sum2" value={calculatePayAmount(2)} checked={payAmount === calculatePayAmount(2)} onChange={handlePayChange} />
              <span className="checkmark checkmark--sum">{`${calculatePayAmount(2)}€`}</span>
            </label>
            <label className="card__option">
              <input disabled={!serviceProvider} className="card__input" type="radio" name="sum2" value={calculatePayAmount(4)} checked={payAmount === calculatePayAmount(4)} onChange={handlePayChange} />
              <span className="checkmark checkmark--sum">{`${calculatePayAmount(4)}€`}</span>
            </label>
            <label className="card__option">
              <input disabled={!serviceProvider} className="card__input" type="radio" name="sum2" value={calculatePayAmount(6)} checked={payAmount === calculatePayAmount(6)} onChange={handlePayChange} />
              <span className="checkmark checkmark--sum">{`${calculatePayAmount(6)}€`}</span>
            </label>
            <label className="card__option">
              <input disabled={!serviceProvider} className="card__input" type="radio" name="sum2" value={calculatePayAmount(8)} checked={payAmount === calculatePayAmount(8)} onChange={handlePayChange} />
              <span className="checkmark checkmark--sum">{`${calculatePayAmount(8)}€`}</span>
            </label>
          </div>
        </div>
        <div className="button-wrapper">
          <button onClick={openModal} className="button"><span role="img" aria-label="hedge">🦔</span> Hedge it</button>
        </div>
        </>
    )
  }

  const renderInvestContent = () => {
    return (
      <div className="card">
        <TakerView/>
      </div>
    )
  }

  const className = classNames('App',
    {
      'item-is-selected': serviceProvider !== null
    }
  );

  return (
    <div className={className}>
      <div className="container">
        <div className="logo__wrapper">
          <img className="logo" alt="logo" src={Logo} />
        </div>
        <div className="card">
          <div className="card__product-options tabs">
            <label className="card__product-option">
              <input className="card__input" type="radio" name="tabs" value="insure" checked={selectedChoice === 'insure'} onChange={handleTabsChange} />
              <span className="checkmark">Insure</span>
            </label>
            <label className="card__product-option">
              <input className="card__input" type="radio" name="tabs" value="invest" checked={selectedChoice === 'invest'} onChange={handleTabsChange} />
              <span className="checkmark">Invest</span>
            </label>
          </div>
        </div>
        {selectedChoice === 'insure' && renderInsureContent()}
        {selectedChoice === 'invest' && renderInvestContent()}
      </div>
      <Modal
          isOpen={!choiceMade}
          className="choice-modal-wrapper"
          ariaHideApp={false}
        >
          <div className="choice-modal">
            <div className="choice-modal__choice">
              <button className="choice__button choice__button--insure" onClick={onChoiceModalOptionClick.bind(null, 'insure')}>
              <img className="choice-img" src={Insure} alt="insure" />Insure</button>
            </div>
            <div className="choice-modal__choice">
              <button className="choice__button choice__button--invest" onClick={onChoiceModalOptionClick.bind(null, 'invest')}>
              <img className="choice-img" src={Invest} alt="invest" />Invest</button>
          </div>
        </div>
      </Modal>
      <Modal
          isOpen={modalIsOpen}
          onRequestClose={closeModal}
          ariaHideApp={false}
        >
        <button className="modal__button" onClick={closeModal}><FaTimes /></button>
        <h2>Scan or click QRcode</h2>
          <a href={`byteball-tn:UY4GVQ3H5DCI3QY7YJDHFAPULO3TDKYH?amount=${Math.floor(payAmount * rate)}&base64data=${base64data}`}>
            <QRCode size={200} value={`byteball-tn:UY4GVQ3H5DCI3QY7YJDHFAPULO3TDKYH?amount=${Math.floor(payAmount * rate)}&base64data=${base64data}`} />
          </a>
      </Modal>
    </div>
  );
}

export default App;
