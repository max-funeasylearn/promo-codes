System.register(["angular2/core","angular2/http","rxjs/add/operator/map","./vars"],function(o,e){"use strict";var t,r,c,p,s=(e&&e.id,this&&this.__extends||function(o,e){function t(){this.constructor=o}for(var r in e)e.hasOwnProperty(r)&&(o[r]=e[r]);o.prototype=null===e?Object.create(e):(t.prototype=e.prototype,new t)}),i=this&&this.__decorate||function(o,e,t,r){var c,p=arguments.length,s=p<3?e:null===r?r=Object.getOwnPropertyDescriptor(e,t):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(o,e,t,r);else for(var i=o.length-1;i>=0;i--)(c=o[i])&&(s=(p<3?c(s):p>3?c(e,t,s):c(e,t))||s);return p>3&&s&&Object.defineProperty(e,t,s),s},d=this&&this.__metadata||function(o,e){if("object"==typeof Reflect&&"function"==typeof Reflect.metadata)return Reflect.metadata(o,e)};return{setters:[function(o){t=o},function(o){r=o},function(o){},function(o){c=o}],execute:function(){p=function(o){function e(e){this.error="",this.message="",this.form_title="New Promo Code",this.save_button="Create",this.promo_code={promo_code_id:0,user_id:"",project_name:"",comment:"",promo_code_type_id:"",promo_code:"",value:"",valid:1,used:0},this.promo_code_types=[],this.copied_to_clipboard=!1,this.http=e,this.getPromoCodeTypes(),o.call(this)}return s(e,o),e.prototype.save=function(o){var e=this,t={headers:{"Content-Type":"application/json"}},r="";r=0==this.promo_code.promo_code_id?"/promo_codes/create":"/promo_codes/edit",this.http.post(r,JSON.stringify(this.promo_code),t).map(function(o){return o.json()}).subscribe(function(o){return e.saveCallback(o)})},e.prototype.selectPromoCodeType=function(o){for(var e in this.promo_code_types)if(this.promo_code_types[e].promo_code_type_id==parseInt($(o).val())){this.promo_code.project_name=this.promo_code_types[e].project_name,this.promo_code.comment=this.promo_code_types[e].comment;break}},e.prototype.getPromoCodeTypes=function(){var o=this;this.http.get("/promo_code_types").map(function(o){return o.json()}).subscribe(function(e){return o.getPromoCodeTypesCallback(e)})},e.prototype.onDisplay=function(){return this.getPromoCodeTypes(),0!=parseInt($("#promo_code_id").val())?(this.promo_code.promo_code_id=$("#promo_code_id").val(),this.promo_code.promo_code_type_id=$('#promo_code_type_id option[selected="selected"]').attr("value"),this.promo_code.promo_code=$("#generated_promo_code").val(),this.promo_code.value=$("#value").val(),this.selectPromoCodeType(document.querySelector("select#promo_code_type_id"))):this.promo_code={promo_code_id:0,user_id:"",project_name:"",comment:"",promo_code_type_id:"",promo_code:"",value:"",valid:1,used:0},this.message="",this.error="",new Clipboard(".btn#copy_promo_code").on("success",function(){$("#copy_promo_code").nextAll().remove(),$("#copy_promo_code").after('<p class="text-success">The promo code was copied in clipboard.</p>')}),!0},e.prototype.saveCallback=function(o){void 0===o.error?(void 0!==o.promo_code_str&&(this.promo_code.promo_code=o.promo_code_str),void 0!==o.promo_code_id?(this.promo_code.promo_code_id=o.promo_code_id,this.message="Promo code successfully created",$("#save_promo_code_button").text("Save")):this.message="Promo code successfully updated"):this.error=o.error},e.prototype.getPromoCodeTypesCallback=function(o){void 0===o.error?this.promo_code_types=o:(this.promo_code_types=[],this.error=o.error)},e.prototype.copyToClipboard=function(){$("#promo_code").select(),document.execCommand("Copy")},e=i([t.Component({selector:"main-container#promo_code_form",viewProviders:[r.HTTP_PROVIDERS],templateUrl:"partials/promo_code_form.html"}),d("design:paramtypes",[r.Http])],e)}(c.Vars),o("PromoCodeComponent",p)}}});