import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { Cell, Column, ColumnGroup, Table } from 'fixed-data-table';
import '../../../node_modules/fixed-data-table/dist/fixed-data-table.css';
import _ from 'lodash';

// Kei Sing Wong -----
import cx from 'classnames';
import './style.css';

const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};
// -------------------

@connect(
    state => ({rows: state.rows, cols: state.cols || new Array(10)})
)
export default class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      rows: [],
      cols: new Array(10),
      trends: []  // Kei Sing Wong
    };
    this.onSnapshotReceived = this.onSnapshotReceived.bind(this);
    // Kei Sing Wong -----
    // this.onUpdateReceived = this.onUpdateReceived.bind(this);
    this.duration = 500;  // milli-second (update twice in a second)
    this.onUpdateReceived = throttle( this.onUpdateReceived.bind(this), this.duration );
    // -------------------
    this._cell = this._cell.bind(this);
    this._headerCell = this._headerCell.bind(this);
    this._generateCols = this._generateCols.bind(this);
  }

  onSnapshotReceived(data) {
    let rows = [];
    const trends = [];  // Kei Sing Wong

    data.forEach(row => {
      rows[row.id] = row;
      trends[row.id] = [];  // Kei Sing Wong
    });
    // const rows = this.state.rows.concat(data);
    console.log('snapshot' + rows);
    const cols = Object.keys(rows[0]);
    // this.setState({rows, cols});
    this.setState({rows, cols, trends}); // Kei Sing Wong
  }
  onUpdateReceived(data) {
    // const rows = this.state.rows.concat(data);

    // let rows = this.state.rows;
    const { rows, cols, trends } = this.state;  // Kei Sing Wong

    data.forEach(newRow => {
      // Kei Sing Wong -----
      cols.forEach( col => {
        trends[newRow.id][col] = newRow[col] - rows[newRow.id][col];
      });
      // -------------------
      rows[newRow.id] = newRow;
    });

    this.setState({rows});
  }
  _cell(cellProps) {
    const rowIndex = cellProps.rowIndex;
    const rowData = this.state.rows[rowIndex];
    const col = this.state.cols[cellProps.columnKey];
    const content = rowData[col];
    // Kei Sing Wong -----
    // return (
    //   <Cell>{content}</Cell>
    // );
    const trend = this.state.trends[rowIndex][col];
    return (
      <Cell>
        <span className={cx({'gain': trend > 0, 'loss': trend < 0})}>{content}</span>
      </Cell>
    );
    // -------------------
  }

  _headerCell(cellProps) {
    const col = this.state.cols[cellProps.columnKey];
    return (
      <Cell>{col}</Cell>
    );
  }

  _generateCols() {
    console.log('generating...');
    let cols = [];
    this.state.cols.forEach((row, index) => {
      cols.push(
        <Column
          width={100}
          flexGrow={1}
          cell={this._cell}
          header={this._headerCell}
          columnKey={index}
          />
      );
    });
    console.log(cols);
    return cols;
  }
  componentDidMount() {
    if (socket) {
      socket.on('snapshot', this.onSnapshotReceived);
      socket.on('updates', this.onUpdateReceived);
    }
  }
  componentWillUnmount() {
    if (socket) {
      socket.removeListener('snapshot', this.onSnapshotReceived);
      socket.removeListener('updates', this.onUpdateReceived);
    }
  }

  render() {
    const columns = this._generateCols();
    return (
      <Table
        rowHeight={30}
        width={window.innerWidth}
        maxHeight={window.innerHeight}
        headerHeight={35}
        rowsCount={this.state.rows.length}
        >
        {columns}
      </Table>
    );
  }
}
