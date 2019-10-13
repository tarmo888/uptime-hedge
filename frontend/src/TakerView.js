import React from 'react'
import axios from 'axios'
import './TakerView.scss'
import { format } from 'date-fns'


export default class TakerView extends React.Component {
    state = {
        items: null,
        currencyRate: null
    }
    componentDidMount() {
        this.setState({
            items: [{
                responseTimestamp: '1570969315',
				serviceProvider: 'Google Cloud',
				insuranceAmount: '3000000',
				payAmount: '100000000',
				willCrash: 0
            },{
                responseTimestamp: '1570969315',
				serviceProvider: 'Google Cloud',
				insuranceAmount: '3000000',
				payAmount: '100000000',
				willCrash: 0
            },{
                responseTimestamp: '1570969315',
				serviceProvider: 'Google Cloud',
				insuranceAmount: '3000000',
				payAmount: '100000000',
				willCrash: 0
            },{
                responseTimestamp: '1570969315',
				serviceProvider: 'Google Cloud',
				insuranceAmount: '3000000',
				payAmount: '100000000',
				willCrash: 0
            },{
                responseTimestamp: '1570969315',
				serviceProvider: 'Google Cloud',
				insuranceAmount: '2000000000',
				payAmount: '1000000000',
				willCrash: 0
            }]
        })

        axios.get(`http://uptimehedge.com/api-currencies`).then(res => {
            this.setState({ currencyRate: res.data.data.GBYTE_USD});
          });
        axios.get(`http://uptimehedge.com//api-offers`).then(res => {
            this.setState({ 
                items: res.data
            })
            console.log(this.state.items)
        });
    }
    renderRows() {
        return this.state.items && this.state.items.map((items, id) => {
            return (
            <tr key={id} >
                <td>{format(new Date(items.responseTimestamp * 1000),'dd.MM.yyyy HH:mm:ss')}</td>
                <td>{items.serviceProvider}</td>
                <td>{this.state.currencyRate * items.insuranceAmount / 1000000000}</td>
                <td>{this.state.currencyRate * (Number(items.insuranceAmount) - Number(items.payAmount)) / 1000000000}</td>
            </tr>
            )
        })
    }

    render() {
        return (
            <div>
                 <div className="card_title" >Pick an insurance to invest in!</div>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Service Provider</th>
                            <th>Insured for</th>
                            <th>Pay this much</th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.renderRows()}
                    </tbody>
                </table>
            </div>
        )
    }
}