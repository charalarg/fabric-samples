import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalDismissReasons, NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from 'src/app/services/api.service';
import { ToastsService } from 'src/app/services/toast.servive';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-user-tab',
  templateUrl: './user-tab.component.html',
  styleUrls: ['./user-tab.component.scss']
})
export class UserTabComponent implements OnInit {
  @ViewChild('revokeCert') revokeCert!: NgbActiveModal;
  closeResult = '';
  selectedURL = '';
  userID = '';
  name = '';
  surname = '';
  nationalId = '';
  dateOfBirth = '';
  gender = '';
  certificates!: any[];
  selectedCertificate: any;
  selectedTransactions: any[] = [];
  loading: boolean = false;
  constructor(
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private toastService: ToastsService
  ) { }

  ngOnInit(): void {
    this.getQueryParams();

  }
  getQueryParams() {
    this.route.queryParams.subscribe(params => {
      if (params['userID']) {
        this.userID = params['userID'];
        this.name = params['name'];
        this.surname = params['surname'];
        this.nationalId = params['nationalId'];
        this.dateOfBirth = params['dateOfBirth'];
        this.gender = params['gender'];
        this.getCertificates(params['userID']);
      } else {
        this.router.navigate(['/main/manage-users']);
      }

    })
  }
  getValidationUrl(hash: string) {
    let validationURL: string = `${environment.APP_URL}/validate-certificate/${hash}`
    return validationURL;
  }
  getDate(date: any) {
    return new Date(date * 100)

  }
  viewCertificate(content: any, certificate: any) {
    this.selectedCertificate = certificate;
    this.getTransactions(certificate);
    this.modalService.open(content, { size: 'xl', ariaLabelledBy: 'modal-basic-title' }).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;
      this.selectedCertificate = '';
      this.selectedTransactions = [];
    }, (reason) => {
      this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
    });
  }


  revokeCertificate(content: any, certificateHash: string) {
    this.selectedCertificate = certificateHash;
    this.modalService.open(content, { size: 'md', ariaLabelledBy: 'modal-basic-title' }).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;
      this.selectedCertificate = '';
      this.selectedTransactions = [];
    }, (reason) => {
      this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      this.selectedCertificate = '';
      this.selectedTransactions = [];
    });
  }

  private getDismissReason(reason: any): string {
    this.selectedCertificate = '';
    this.selectedTransactions = [];
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }


  getCertificates(userID: string) {
    this.loading = true;
    this.apiService.getCertificatesByUser(userID).toPromise().then(res => {
      this.certificates = res;
      this.loading = false;
    });
  }

  revokeThisCert() {


    this.apiService.revokeCert(this.selectedCertificate).toPromise().then(res => {
      this.getCertificates(this.userID);
      this.modalService.dismissAll()
      this.toastService.successToast('Certificate Revoked!');
    });
  }


  getTransactions(certificate: any) {
    certificate?.transaction_ids.forEach((transaction: any) => {
      this.apiService.getTransaction(transaction).toPromise().then(res => {
        this.selectedTransactions.push(res);
      })
    });

  }
}
