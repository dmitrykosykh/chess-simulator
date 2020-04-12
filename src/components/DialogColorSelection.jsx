import React from 'react';
import './DialogColorSelection.css';

class DialogColorSelection extends React.Component {
  render = () => (
    <div>
      <p className="dialog-color-selection__title">Выберите цвет за который вы хотите играть?</p>
      <div className="dialog-color-selection">
        <div className="dialog-color-selection__white" onClick={() => this.props.handleChoiceColor('white')} />
        <div className="dialog-color-selection__black" onClick={() => this.props.handleChoiceColor('black')} />
      </div>
    </div>
  )
}

export default DialogColorSelection;
