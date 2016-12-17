import React from 'react'
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import FontIcon from 'material-ui/FontIcon'
import RaisedButton from 'material-ui/RaisedButton';
import { connect } from 'react-redux'
import AceEditor from 'react-ace';
import 'brace/mode/json'
import 'brace/theme/github'
import { SUBMIT_JOB } from '../../sagas/event'

class JobEditRawJSON extends React.Component {

  modifiedJob = undefined

  constructor(props) {
    super(props);

    this.state = { open: false }
  }

  handleOpen = () => {
    this.modifiedJob = JSON.stringify(this.props.job, null, 2)

    this.setState({
      open: true,
      job: this.props.job,
      submittingJob: false,
      jobOutOfSync: false,
      readOnlyEditor: false,
    });
  }

  /**
   * On every key stroke, we save the changed output
   *
   * @param  {string} value
   * @return {void}
   */
  onEditorChange = (value) => {
    this.modifiedJob = value
  }

  /**
   * On Cancel, we simply just hide the dialog
   *
   * All state will be reset in `handleOpen`
   *
   * @return {void}
   */
  handleCancel = () => {
    this.setState({
      ...this.state,
      open: false
    });
  };

  /**
   * When submitting the job by clicking 'submit'
   *
   * @return {void}
   */
  handleSubmit = () => {
    this.setState({
      ...this.state,
      submittingJob: true,
      readOnlyEditor: true
    })

    this.props.dispatch({
      type: SUBMIT_JOB,
      payload: this.modifiedJob
    })
  };

  componentWillReceiveProps = (nextProps) =>  {
    // if we got no job prop, ignore the props
    if (!nextProps.job.ID) {
      return;
    }

    // if we get props while submitting a job
    if (this.state.submittingJob) {
      // on success, close the dialog
      if (nextProps.successNotification.index) {
        this.setState({ open: false })
        return;
      }

      // on error, make the form editable again
      if (nextProps.errorNotification.index) {
        this.setState({
          ...this.state,
          submittingJob: false,
          readOnlyEditor: false,
        })
        return;
      }
    }

    // if we got no job state, don't bother with JobModifyIndex check
    if (!this.state.job) {
      return;
    }

    // the current job state and the new job prop JobModifyIndex is different, our editor is stale
    if (this.state.job.JobModifyIndex != nextProps.job.JobModifyIndex) {
      this.setState({
        ...this.state,
        jobOutOfSync: true,
        readOnlyEditor: true,
      })
    }
  }

  render() {
    const actions = [
      <FlatButton
        label='Cancel'
        primary
        onTouchTap={ this.handleCancel }
      />,
      <FlatButton
        label='Submit job'
        primary
        disabled={ this.state.jobOutOfSync || this.state.submittingJob }
        onTouchTap={ this.handleSubmit }
      />,
    ];

    let title = `Edit job: ${this.props.job.ID}`
    let titleStyle = {};
    if (this.state.jobOutOfSync && !this.state.submittingJob) {
      title = title + ' - JOB WAS CHANGED SINCE YOU LOADED IT';
      titleStyle = { color: 'red' }
    }

    return (
      <div>
        <RaisedButton
          label='Edit Job'
          onTouchTap={ this.handleOpen }
          icon={ <FontIcon className='material-icons'>edit</FontIcon> }
        />
        <Dialog
          title={ title }
          titleStyle={ titleStyle }
          actions={ actions }
          modal
          open={ this.state.open }
          bodyStyle={{ padding: 0 }}
        >
          <AceEditor
            mode='json'
            theme='github'
            name='edit-job-json'
            value={ this.modifiedJob }
            readOnly={ this.state.readOnlyEditor }
            width='100%'
            height={ 380 }
            tabSize={ 2 }
            onChange={ this.onEditorChange }
            wrapEnabled
            focus
          />
        </Dialog>
      </div>
    );
  }
}

function mapStateToProps ({ job, errorNotification, successNotification }) {
  return { job, errorNotification, successNotification }
}

JobEditRawJSON.propTypes = {
  dispatch: React.PropTypes.func.isRequired,
  job: React.PropTypes.object.isRequired,
}

export default connect(mapStateToProps)(JobEditRawJSON)