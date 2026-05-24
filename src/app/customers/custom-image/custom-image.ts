import {Component, input} from '@angular/core';

@Component({
  selector: 'app-custom-image',
  standalone: false,
  templateUrl: './custom-image.html',
  styleUrl: './custom-image.css',
})
export class CustomImage {
  imgUrl = input.required()
  altText = input("Image")
  leftAlign = input(false)
  title = input("")
  description = input("")
}
