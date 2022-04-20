import { Component, OnInit } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from 'src/app/services/api.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  selectedURL = environment.APP_URL + '/validate-certificate/' + 'id';
  selectedCertificate :any;
  closeResult = '';
  certificates!: any[];
  constructor(private modalService: NgbModal, private apiService: ApiService) { }

  ngOnInit(): void {
    console.log("hello");
    this.getCertificates();
  }
  viewCertificate(content: any, certificate:any) {
    this.selectedCertificate = certificate;
    console.log(certificate);
    this.modalService.open(content, { windowClass: 'cert-modal', size: 'xl', ariaLabelledBy: 'modal-basic-title' }).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;
      this.selectedCertificate= '';
    }, (reason) => {
      this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
    });
  }


  private getDismissReason(reason: any): string {
    this.selectedCertificate= '';
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  getValidationUrl(hash: string) {
    let validationURL: string = `${environment.APP_URL}/validate-certificate/${hash}`
    return validationURL;
  }
  getDate(date: any) {
    return new Date(date * 1000)

  }

  public getCertificates() {
    this.apiService.getCertificates().subscribe(res => {
      this.certificates = res;
    })
  }
}
