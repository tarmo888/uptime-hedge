import React from 'react'
import axios from 'axios'
import './TakerView.scss'

export default class TakerView extends React.Component {
    state = {
        items: null
    }
    componentDidMount() {
        this.setState({
            items: [{
                responseTimestamp: '1570969315',
				serviceProvider: 'Google Cloud',
				insuranceAmount: '3000000',
				payAmount: '100000000',
				willCrash: 0
            }]
        })
        // axios.get(`localhost:8080/api-offers`).then(res => {
        //     console.log('res ', JSON.stringify(res))
        //     this.setState({ 
        //         items: res.data
        //     })
        //     console.log(this.state.items)
        // });
    }
    renderRows() {
        return this.state.items && this.state.items.map((items, id) => {
            return (
            <tr key={id} >
                <td>{items.responseTimestamp}</td>
                <td>{items.serviceProvider}</td>
                <td>{items.insuranceAmount}</td>
                <td>{items.payAmount}</td>
            </tr>
            )
        })
    }

    render() {
        return (
            <div className="container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Service Provider</th>
                            <th>Insured for</th>
                            <th>Amount paid</th>
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