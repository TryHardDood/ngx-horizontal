import {
  AfterContentInit,
  Component,
  ContentChildren,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  QueryList,
  TemplateRef,
  ViewChild
} from "@angular/core";
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { NgxHorizontalItemDirective } from "./ngx-horizontal-item.directive";
import { fromEvent } from "rxjs";

interface NgxHorizontalData {
  left?: number;
  containerWidth?: number;
  scrollWidth?: number;
  hasPrev?: boolean;
  hasNext?: boolean;
  debounceId?: number | null;
}

const delta = 2.5;

@Component({
  selector: "[ngx-horizontal]",
  templateUrl: "./ngx-horizontal.component.html",
  styleUrls: ["./ngx-horizontal.component.css"],
})
export class NgxHorizontalComponent implements AfterContentInit, OnDestroy {
  @ContentChildren(NgxHorizontalItemDirective, { descendants: true, read: ElementRef })
  slots: QueryList<ElementRef> = new QueryList<ElementRef>();

  @ViewChild('btn-next', { read: TemplateRef })
  nextButtonTemplateRef: TemplateRef<any>;

  @ViewChild('btn-prev', { read: TemplateRef })
  prevButtonTemplateRef: TemplateRef<any>;

  @ViewChild('container', { read: ElementRef, static: true })
  container!: ElementRef;

  @Input()
  containerClass: string;

  @Input()
  button: boolean = false;

  @Input()
  scroll: boolean = false;

  @Input()
  responsive: boolean = false;

  @Input()
  displacement: number = 1.0;

  @Input()
  snap: string = "start";

  @Input()
  autoplay: number;

  @Output()
  scrollDebounce: EventEmitter<NgxHorizontalData> = new EventEmitter();

  @Output()
  scrollEvent: EventEmitter<NgxHorizontalData> = new EventEmitter();

  @Output()
  nextEvent: EventEmitter<NgxHorizontalData> = new EventEmitter();

  @Output()
  prevEvent: EventEmitter<NgxHorizontalData> = new EventEmitter();

  private left: number;
  private containerWidth: number;
  private scrollWidth: number;
  private hasPrev: boolean = false;
  private hasNext: boolean = false;

  private autoplayIntervalId: ReturnType<typeof setInterval | null>;

  constructor() { }

  ngAfterContentInit(): void {
    this.onScrollDebounce();
    fromEvent(this.container.nativeElement, 'scroll').pipe(debounceTime(500), distinctUntilChanged()).subscribe(() => {
      this.scrollEvent.emit({
        left: this.container.nativeElement.scrollLeft
      });

      this.onScrollDebounce();
    });

    if (this.autoplay) {
      this.autoplayIntervalId = setInterval(() => {
        this.play();
        this.scrollToIndex(1);
      }, this.autoplay);
    }
  }

  ngOnDestroy(): void {
    if (this.autoplayIntervalId) {
      clearInterval(this.autoplayIntervalId);
    }
  }

  private findPrevSlot(x: number): ElementRef | undefined {
    const slots = this.slots.toArray();
    for (let i = 0; i < slots.length; i++) {
      const rect = (slots[i].nativeElement as Element).getBoundingClientRect();
      if (rect.left <= x && x <= rect.right) {
        return slots[i];
      }
      if (x <= rect.left) {
        return slots[i];
      }
    }
  }

  private findNextSlot(x: number): ElementRef | undefined {
    const slots = this.slots.toArray();
    for (let i = 0; i < slots.length; i++) {
      const rect = (slots[i].nativeElement as Element).getBoundingClientRect();
      if (rect.right <= x) {
        continue;
      } else if (rect.left <= x) {
        return slots[i];
      }
      if (x <= rect.left) {
        return slots[i];
      }
    }
  }

  public prev(): void {
    this.prevEvent.emit();

    const container = this.container.nativeElement as Element;
    const left = container.getBoundingClientRect().left;
    const x = left + container.clientWidth * -this.displacement - delta;
    const slot = this.findPrevSlot(x);
    if (slot) {
      const width = (slot.nativeElement as Element).getBoundingClientRect().left - left;
      this.scrollToLeft(container.scrollLeft + width);
      return;
    }
    const width = container.clientWidth * this.displacement;
    this.scrollToLeft(container.scrollLeft - width);
  }

  public next(): void {
    this.nextEvent.emit();

    const container = this.container.nativeElement as Element;
    const left = container.getBoundingClientRect().left;
    const x = left + container.clientWidth * this.displacement + delta;
    const slot = this.findNextSlot(x);
    if (slot) {
      const width = (slot.nativeElement as Element).getBoundingClientRect().left - left;
      if (width > delta) {
        this.scrollToLeft(container.scrollLeft + width);
        return;
      }
    }
    const width = container.clientWidth * this.displacement;
    this.scrollToLeft(container.scrollLeft + width);
  }

  public scrollToIndex(i: number): void {
    const slots = this.slots.toArray();
    if (slots[i]) {
      const container = this.container.nativeElement as Element;
      const rect = (slots[i].nativeElement as Element).getBoundingClientRect();
      const left = rect.left - container.getBoundingClientRect().left;
      this.scrollToLeft(container.scrollLeft + left);
    }
  }

  private scrollToLeft(left: number, behavior: "smooth" | "auto" = "smooth"): void {
    const element = this.container.nativeElement as Element;
    element.scrollTo({ left: left, behavior: behavior });
  }

  private onScrollDebounce(): void {
    this.refresh();

    this.scrollDebounce.emit({
      left: this.left,
      containerWidth: this.containerWidth,
      scrollWidth: this.scrollWidth,
      hasPrev: this.hasPrev,
      hasNext: this.hasNext
    });
  }

  public refresh(): void {
    const container = this.container.nativeElement as Element;
    const slot0 = this.slots.first.nativeElement as Element;

    function hasNext(): boolean {
      return container.scrollWidth + delta > container.scrollLeft + container.clientWidth + delta;
    }

    function hasPrev(): boolean {
      if (container.scrollLeft === 0) {
        return false;
      }

      const containerVWLeft = container.getBoundingClientRect().left;
      const slot0VWLeft = slot0?.getBoundingClientRect()?.left ?? 0;
      return Math.abs(containerVWLeft - slot0VWLeft) >= delta;;
    }

    this.left = container.scrollLeft;
    this.containerWidth = container.clientWidth;
    this.scrollWidth = container.scrollWidth;
    this.hasNext = hasNext();
    this.hasPrev = hasPrev();
  }

  private play(): void {
    if (!this.hasNext && this.hasPrev) {
      this.scrollToIndex(0);
      this.displacement = 1.0;
      return;
    }

    if (this.hasNext) {
      this.next();
      this.displacement = 0.6;
    }
  }
}
