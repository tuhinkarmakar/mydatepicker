import {Component, View, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChange} from 'angular2/core';
import {NgIf, NgFor, NgClass, NgStyle} from 'angular2/common';
import {MyDate, MyMonth} from './interfaces';

@Component({
    selector: 'my-date-picker'
})
@View({
    templateUrl: 'app/template/mydatepicker.html',
    styleUrls: ['app/css/mydatepicker.css'],
    directives: [NgIf, NgFor, NgClass, NgStyle]
})

export class MyDatePicker implements OnInit, OnChanges {
    @Input() options:any;
    @Input() selDate:string;
    @Output() dateChanged:EventEmitter<Object> = new EventEmitter();

    showSelector:boolean = false;
    visibleMonth:MyMonth = {monthTxt: '', monthNbr: 0, year: 0};
    selectedDate:MyDate = {year: 0, month: 0, day: 0};
    weekDays:Array<string> = [];
    dates:Array<Object> = [];
    selectionDayTxt:string = '';
    dayIdx:number = 0;

    PREV_MONTH:number = 1;
    CURR_MONTH:number = 2;
    NEXT_MONTH:number = 3;

    // Default options
    dayLabels = {su: 'Sun', mo: 'Mon', tu: 'Tue', we: 'Wed', th: 'Thu', fr: 'Fri', sa: 'Sat'};
    monthLabels = { 1: 'Jan', 2: 'Feb', 3: 'Mar', 4: 'Apr', 5: 'May', 6: 'Jun', 7: 'Jul', 8: 'Aug', 9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dec' };
    dateFormat:string = 'yyyy-mm-dd'
    firstDayOfWeek:string = 'mo';
    sunHighlight:boolean = true;
    height:string = '34px';
    width:string = '100%';

    today = new Date();

    constructor() {}

    ngOnInit() {
        this.dayLabels = this.options.dayLabels !== undefined ? this.options.dayLabels : this.dayLabels;
        this.monthLabels = this.options.monthLabels !== undefined ? this.options.monthLabels : this.monthLabels;
        this.dateFormat = this.options.dateFormat !== undefined ? this.options.dateFormat : this.dateFormat;
        this.firstDayOfWeek = this.options.firstDayOfWeek !== undefined ? this.options.firstDayOfWeek : this.firstDayOfWeek;
        this.sunHighlight = this.options.sunHighlight !== undefined ? this.options.sunHighlight : this.sunHighlight;
        this.height = this.options.height !== undefined ? this.options.height : this.height;
        this.width = this.options.width !== undefined ? this.options.width : this.width;

        var days = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];
        this.dayIdx = days.indexOf(this.firstDayOfWeek);
        if (this.dayIdx !== -1) {
            var idx = this.dayIdx;
            for (var i = 0; i < days.length; i++) {
                this.weekDays.push(this.dayLabels[days[idx]]);
                idx = days[idx] === 'sa' ? 0 : idx + 1;
            }
        }
    }

    ngOnChanges(changes: {[propName: string]: SimpleChange}) {
        var fmt = this.options.dateFormat !== undefined ? this.options.dateFormat : this.dateFormat;
        var dpos = fmt.indexOf('dd');
        var mpos = fmt.indexOf('mm');
        var ypos = fmt.indexOf('yyyy');
        this.selectionDayTxt = changes['selDate'].currentValue;
        this.selectedDate = {day: parseInt(this.selectionDayTxt.substring(dpos, dpos + 2)),
            month: parseInt(this.selectionDayTxt.substring(mpos, mpos + 2)),
            year: parseInt(this.selectionDayTxt.substring(ypos, ypos + 4))};
    }

    removeBtnClicked():void {
        this.selectionDayTxt = '';
        this.selectedDate = {year: 0, month: 0, day: 0};
        this.dateChanged.emit({date: {}, formatted: this.selectionDayTxt, epoc: 0});
        this.selDate = '';
    }

    openBtnClicked():void {
        this.showSelector = !this.showSelector;
        if (this.showSelector) {
            var y = 0, m = 0;
            if (this.selectedDate.year === 0 && this.selectedDate.month === 0 && this.selectedDate.day === 0) {
                y = this.today.getFullYear();
                m = this.today.getMonth() + 1;
            }
            else {
                y = this.selectedDate.year;
                m = this.selectedDate.month;
            }
            // Set current month
            this.visibleMonth = {monthTxt: this.monthLabels[m], monthNbr: m, year: y};

            // Create current month
            this.createMonth(m, y);
        }
    }

    prevMonth():void {
        var m = this.visibleMonth.monthNbr;
        var y = this.visibleMonth.year;
        if (m === 1) {
            m = 12;
            y--;
        }
        else {
            m--;
        }
        this.visibleMonth = {monthTxt: this.monthText(m), monthNbr: m, year: y};
        this.createMonth(m, y);
    }

    nextMonth():void {
        var m = this.visibleMonth.monthNbr;
        var y = this.visibleMonth.year;
        if (m === 12) {
            m = 1;
            y++;
        }
        else {
            m++;
        }
        this.visibleMonth = {monthTxt: this.monthText(m), monthNbr: m, year: y};
        this.createMonth(m, y);
    }

    prevYear():void {
        this.visibleMonth.year--;
        this.createMonth(this.visibleMonth.monthNbr, this.visibleMonth.year);
    }

    nextYear():void {
        this.visibleMonth.year++;
        this.createMonth(this.visibleMonth.monthNbr, this.visibleMonth.year);
    }

    todayClicked():void {
        // Today selected
        var m = this.today.getMonth() + 1;
        this.visibleMonth = {monthTxt: this.monthText(m), monthNbr: m, year: this.today.getFullYear()};
        this.createMonth(this.visibleMonth.monthNbr, this.visibleMonth.year);
    }

    cellClicked(cell:any):void {
        // Cell clicked in the selector
        if (cell.cmo === this.PREV_MONTH) {
            // Previous month of day
            this.prevMonth();
        }
        else if (cell.cmo === this.CURR_MONTH) {
            // Current month of day
            this.selectedDate = {day: cell.day, month: cell.month, year: cell.year};
            this.selectionDayTxt = this.formatDate(cell);
            this.showSelector = false;
            var epoc = new Date(cell.year, cell.month - 1, cell.day, 0, 0, 0, 0).getTime() / 1000.0;
            this.dateChanged.emit({date: this.selectedDate, formatted: this.selectionDayTxt, epoc: epoc});
            this.selDate = this.selectionDayTxt;
        }
        else if (cell.cmo === this.NEXT_MONTH) {
            // Next month of day
            this.nextMonth();
        }
    }

    preZero(val:string):string {
        // Prepend zero if smaller than 10
        return val < 10 ? '0' + val : val;
    }

    formatDate(val:any):string {
        return this.dateFormat.replace('yyyy', val.year)
            .replace('mm', this.preZero(val.month))
            .replace('dd', this.preZero(val.day));
    }

    monthText(m:number):string {
        // Returns mont as a text
        return this.monthLabels[m];
    }

    monthStartIdx(y:number, m:number):number {
        // Month start index
        var d = new Date();
        d.setDate(1);
        d.setMonth(m - 1);
        d.setFullYear(y);
        var idx = d.getDay() + this.sundayIdx();
        return idx >= 7 ? idx - 7 : idx;
    }

    daysInMonth(m:number, y:number):number {
        // Return number of days of current month
        return new Date(y, m, 0).getDate();
    }

    daysInPrevMonth(m:number, y:number):number {
        // Return number of days of the previous month
        if (m === 1) {
            m = 12;
            y--;
        }
        else {
            m--;
        }
        return this.daysInMonth(m, y);
    }

    isCurrDay(d:number, m:number, y:number, cmo:any):boolean {
        // Check is a given date the current date
        return d === this.today.getDate() && m === this.today.getMonth() + 1 && y === this.today.getFullYear() && cmo === 2;
    }

    sundayIdx():number {
        // Index of Sunday day
        return this.dayIdx > 0 ? 7 - this.dayIdx : 0;
    }

    createMonth(m:number, y:number): void {
        this.dates.length = 0;
        var monthStart = this.monthStartIdx(y, m);
        var dInThisM = this.daysInMonth(m, y);
        var dInPrevM = this.daysInPrevMonth(m, y);
        var sunIdx = this.sundayIdx();

        var dayNbr = 1;
        var cmo = this.PREV_MONTH;
        for (var i = 1; i < 7; i++) {
            var week = [];
            if (i === 1) {
                // First week
                var pm = dInPrevM - monthStart + 1;
                // Previous month
                for (var j = pm; j <= dInPrevM; j++) {
                    week.push({day: j, month: m, year: y, cmo: cmo, currDay: this.isCurrDay(j, m, y, cmo), sun: week.length === sunIdx});
                }
                cmo = this.CURR_MONTH;
                // Current month
                var daysLeft = 7 - week.length;
                for (var j = 0; j < daysLeft; j++) {
                    week.push({day: dayNbr, month: m, year: y, cmo: cmo, currDay: this.isCurrDay(dayNbr, m, y, cmo), sun: week.length === sunIdx});
                    dayNbr++;
                }
            }
            else {
                // Rest of the weeks
                for (var j = 1; j < 8; j++) {
                    if (dayNbr > dInThisM) {
                        // Next month
                        dayNbr = 1;
                        cmo = this.NEXT_MONTH;
                    }
                    week.push({day: dayNbr, month: m, year: y, cmo: cmo, currDay: this.isCurrDay(dayNbr, m, y, cmo), sun: week.length === sunIdx});
                    dayNbr++;
                }
            }
            this.dates.push(week);
        }
    }
}