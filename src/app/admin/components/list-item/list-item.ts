import {Component, input} from '@angular/core';
import {IconSvgObject} from '@hugeicons/angular';
import {Add01Icon} from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-list-item',
  standalone: false,
  templateUrl: './list-item.html',
  styleUrls: [
    './list-item.css',
    '../../../../styles.css',
    '../../../../../public/css/typography.css',
    '../../../../../public/css/form.css',
    '../../../../../public/css/layout.css'
  ],
})
export class ListItem {
  title = input<string>();
  icon = input<IconSvgObject>();
  action= input<string>();
  isAddButton = input<boolean>(false)
  isOpen = input<boolean>(false)

  protected readonly Add01Icon = Add01Icon;
}
