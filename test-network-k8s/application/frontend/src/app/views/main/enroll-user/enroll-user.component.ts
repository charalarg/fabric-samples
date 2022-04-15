import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { LocalStorageService } from 'ngx-webstorage';

@Component({
  selector: 'app-enroll-user',
  templateUrl: './enroll-user.component.html',
  styleUrls: ['./enroll-user.component.scss']
})
export class EnrollUserComponent implements OnInit {
  datepicker!: NgbDateStruct;
  fieldForm!: FormGroup;
  isLoading: boolean = false;
  constructor(private formBuilder: FormBuilder, private localStorage: LocalStorageService, private router: Router) { }

  ngOnInit() {
    this.initForm();
  }

  ngAfterViewInit() {

  }

  initForm() {
    this.fieldForm = this.formBuilder.group({}, { updateOn: 'change' });
    this.fieldForm.addControl('userId', this.formBuilder.control('', [Validators.required, Validators.maxLength(100)]));
    this.fieldForm.addControl('password', this.formBuilder.control('', [Validators.required, Validators.maxLength(100)]));
    this.fieldForm.addControl('name', this.formBuilder.control('', [Validators.required, Validators.maxLength(100)]));
    this.fieldForm.addControl('surname', this.formBuilder.control('', [Validators.required, Validators.maxLength(100)]));
    this.fieldForm.addControl('nationalId', this.formBuilder.control('', [Validators.required, Validators.maxLength(100)]));
    this.fieldForm.addControl('dateOfBirth', this.formBuilder.control('', [Validators.required, Validators.maxLength(100)]));
    this.fieldForm.addControl('gender', this.formBuilder.control('', [Validators.required, Validators.maxLength(100)]));
    this.fieldForm.controls['userId'].updateValueAndValidity();
    this.fieldForm.controls['password'].updateValueAndValidity();
    this.fieldForm.controls['name'].updateValueAndValidity();
    this.fieldForm.controls['surname'].updateValueAndValidity();
    this.fieldForm.controls['nationalId'].updateValueAndValidity();
    this.fieldForm.controls['dateOfBirth'].updateValueAndValidity();
    this.fieldForm.controls['gender'].updateValueAndValidity();
    
  }

  submitForm() {
    if (this.fieldForm.valid) {
      // this.authService.login(this.fieldForm.value).subscribe(async res => {
      //   console.log(res);
      //   if (res?.status) {
      //     await this.localStorage.store(environment.ACCESS_TOKEN, res?.token);
      //     this.router.navigate(['dashboard']);
      //   }
      // });
    }
  }

}
