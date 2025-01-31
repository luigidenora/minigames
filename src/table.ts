import { AudioLoader, Audio, Group } from 'three';
import { Card } from './card';
import { Asset, PointerEventExt } from '@three.ez/main';
import { Confetti } from './confetti';
import { audioListener } from './main';

Asset.preload(AudioLoader, 'assets/win.mp3');

export class Table extends Group {
  public firstCard: Card;
  public secondCard: Card;
  private _cardCount = 16;
  private _isAnimating = false;
  private _cardsLeft: number;
  private _winAudio: Audio;

  constructor() {
    super();
    this._winAudio = new Audio(audioListener).setBuffer(Asset.get('assets/win.mp3'));
    this.bindProperty('enabled', () => !this._isAnimating);
    this.start();
  }

  private start(): void {
    this._cardsLeft = this._cardCount;
    this.createDeck();
  }

  private createDeck(): void {
    const shuffle: number[] = [];
    for (let i = 0; i < this._cardCount; i++) {
      shuffle[i] = Math.trunc(i / 2);
    }

    for (let i = 0; i < this._cardCount; i++) {
      const cardIndex = shuffle.splice(Math.trunc(Math.random() * shuffle.length), 1)[0];
      this.add(this.createCard(cardIndex, i));
    }
  }

  private createCard(index: number, i: number): Card {
    const card = new Card(index, i);
    card.position.set((i % 4) - 1.5, Math.trunc(i / 4) - 1.5, 0);
    card.on('click', this.onClick.bind(this));
    return card;
  }

  private onClick(e: PointerEventExt): void {
    const card = e.currentTarget as Card;

    if (!this.firstCard) this.firstCard = card;
    else this.secondCard = card;

    this.flipCard(card, () => this.checkCouple());
  }

  private flipCard(card: Card, onEnd?: () => void): void {
    this._isAnimating = true;
    card.flip(() => {
      this._isAnimating = false;
      if (onEnd) onEnd();
    });
  }

  private checkCouple(): void {
    if (this.secondCard) {
      if (this.firstCard.index === this.secondCard.index) {
        this.fade();
      } else {
        this.flipCard(this.firstCard);
        this.flipCard(this.secondCard, () => (this.firstCard = this.secondCard = undefined));
      }
    }
  }

  private fade(): void {
    this._isAnimating = true;
    this.firstCard.fade();
    this.secondCard.fade(() => {
      this.firstCard = this.secondCard = undefined;
      this._isAnimating = false;
      this._cardsLeft -= 2;
      this.checkWin();
    });
  }

  private checkWin(): void {
    if (this._cardsLeft === 0) {
      this.scene.add(new Confetti());
      this._winAudio.play();

      setTimeout(() => this.start(), 5000);
    }
  }
}
