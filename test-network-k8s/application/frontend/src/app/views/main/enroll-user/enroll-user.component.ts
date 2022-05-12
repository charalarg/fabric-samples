import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormGroupDirective } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { LocalStorageService } from 'ngx-webstorage';
import { ApiService } from 'src/app/services/api.service';
import { ToastsService } from 'src/app/services/toast.servive';

@Component({
  selector: 'app-enroll-user',
  templateUrl: './enroll-user.component.html',
  styleUrls: ['./enroll-user.component.scss']
})
export class EnrollUserComponent implements OnInit {
  datepicker!: NgbDateStruct;
  fieldForm!: FormGroup;
  isLoading: boolean = false;
  isDisabled: boolean = false;
  today:Date = new Date();
  todayYear:number = new Date().getFullYear();
  todayDay:number = new Date().getDate();
  todayMonth:number = new Date().getMonth();
  constructor(
    private formBuilder: FormBuilder,
    private localStorage: LocalStorageService,
    private router: Router,
    private apiService: ApiService,
    private toastService: ToastsService
  ) { }

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

  submitForm(form: FormGroupDirective) {
    if (this.fieldForm.valid) {
      if (this.fieldForm.value.dateOfBirth.day < 10) {
        this.fieldForm.value.dateOfBirth.day = '0' + this.fieldForm.value.dateOfBirth.day;
      }
      if (this.fieldForm.value.dateOfBirth.month < 10) {
        this.fieldForm.value.dateOfBirth.month = '0' + this.fieldForm.value.dateOfBirth.month;
      }
      let formattedDate = `${this.fieldForm.value.dateOfBirth.year}-${this.fieldForm.value.dateOfBirth.month}-${this.fieldForm.value.dateOfBirth.day}`
      this.fieldForm.value.dateOfBirth = formattedDate;
      console.log(formattedDate);
      this.apiService.enrollStudent(this.fieldForm.value).subscribe(res => {
        this.isDisabled = false;
        this.toastService.successToast('Student enrolled!');
        this.fieldForm.reset();
        form.resetForm();
        this.router.navigate(['main/manage-users']);
      }, error => {
        // console.log(error);
        this.isDisabled = false;
        this.toastService.errorToast('Something went wrong!');
      });

    }
  }

}
