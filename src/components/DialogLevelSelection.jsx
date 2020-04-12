import React from 'react';
import './DialogLevelSelection.css';

class DialogLevelSelection extends React.Component {
  render = () => (
    <div className="dialog-level-selection">
      <div className="dialog-level-selection__level" onClick={() => this.props.handleChoiceLevel(1)}>Уровень 1</div>
    </div>
  )
}

export default DialogLevelSelection;
