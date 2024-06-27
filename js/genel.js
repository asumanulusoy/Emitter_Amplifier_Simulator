
        function analyze() {
            var VCC = parseFloat($('#VCC').val());
            var R1 = parseFloat($('#R1').val());
            var R2 = parseFloat($('#R2').val());
            var RE = parseFloat($('#RE').val());
            var VBE = parseFloat($('#VBE').val());
            var RC = parseFloat($('#RC').val());
            var RG = parseFloat($('#RG').val());
            var RY = parseFloat($('#RY').val());
            var Vin = parseFloat($('#Vin').val());
            var B = parseFloat($('#B').val());

            // DC Sonuçlarını analiz et
            VB = VCC * (R2 / (R1 + R2)); 
            var Rbaz=(R1 * R2) / (R1 + R2);
            var IB = (VB - VBE ) / (101 * RE + Rbaz);
            var IC = 100 * IB;
            var IE = 101 * IB;
            var VCE = VCC - (IC * RC) - (IE*RE);
            var VCB = VCE - VBE;

            var region = (VBE > 0 && VCE > 0) ? "Aktif Bölge" : (VCE < VBE) ? "Doyma Bölgesi" : (IB === 0) ? "Kesim Bölgesi" : "Bilinmeyen Bölge";

            // DC Sonuçlarını textarea'ya yaz
            var result_dc = "VB: " + VB + "\n";
            result_dc += "Rbaz: " + Rbaz + "\n";
            result_dc += "IB: " + IB + "\n";
            result_dc += "IC: " + IC + "\n";
            result_dc += "IE: " + IE + "\n";
            result_dc += "VCE: " + VCE + "\n";
            result_dc += "VCB: " + VCB + "\n";
            result_dc += "VBE: " + VBE + "\n" + "\n";
            result_dc += "Çalışma Bölgesi: " + region + "\n\n";
            $('#result_dc').val(result_dc);

            // AC analizi için hesaplamalar yap (sadece aktif bölgede yapılır)
            if (region === "Aktif Bölge") {
                var gm = 38.92 * IC;
                var rn = 100 / gm;
                var RB = (R1 * R2) / (R1 + R2);
                var Ro = (RC * RY) / (RC + RY);
                var Kvi = -gm * Ro;
                var RB_rn_paralel = (RB * rn) / (RB + rn); //Ri
                var KVG = Kvi * RB_rn_paralel / (RB_rn_paralel + RG);
                var Vout = KVG * Vin;
                var Kviii = Kvi * (RB_rn_paralel / RY); // Akım kazancı
                var KVDI = Kviii * (RG / (RG + RB));

                // Kullanıcıdan alınan Vin ve Vout değerlerini kullanarak kırmızı grafiği çiz
                var time = Array.from({ length: 100 }, (_, i) => i / 10); // 0'dan 10'a kadar olan zaman aralığını oluştur
                var VinValues = time.map(t => Vin * Math.sin(t)); // Giriş gerilimi, zamanla sinüsoidal olarak değişir
                var VoutValues = VinValues.map(Vin => KVG * Vin); // Çıkış gerilimi, Vin ve Kvi ile sinüsoidal olarak hesaplanır

                // AC Sonuçlarını textarea'ya yaz
                var result_ac = "Giriş Direnci (Ri): " + RB_rn_paralel + "\n";
                result_ac += "Çıkış Direnci (Ro): " + Ro + "\n";
                result_ac += "Gerilim Kazancı (Kvi): " + Kvi + "\n";
                result_ac += "Devrenin Gerilim Kazancı (KVG): " + KVG + "\n";
                result_ac += "Akım Kazancı (Kviii): " + Kviii + "\n";
                result_ac += "Devrenin Akım Kazancı (KVDI): " + KVDI + "\n";
                result_ac += "Devrenini Çıkış Gerilimi: (Vout) " + VoutValues + "\n";
                $('#result_ac').val(result_ac);
            } else {
                $('#result_ac').val("Aktif bölgede olmadığı için AC analizi yapılmadı.");
            }

            // Grafiği çiz
            var containerWidth = $('.plot-container').width(); // Konteynerin genişliğini al
            var containerHeight = $('.plot-container').height(); // Konteynerin yüksekliğini al
            var canvas = document.getElementById('plot-canvas');
            canvas.width = containerWidth; // Canvas genişliğini konteyner genişliğine ayarla
            canvas.height = containerHeight; // Canvas yüksekliğini konteyner yüksekliğine ayarla
            var ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // X ve Y eksenlerini çiz
            ctx.beginPath();
            ctx.moveTo(0, containerHeight / 2); // Y ekseninin ortasına git
            ctx.lineTo(containerWidth, containerHeight / 2); // X eksenini çiz
            ctx.moveTo(containerWidth / 2, 0); // X ekseninin ortasına git
            ctx.lineTo(containerWidth / 2, containerHeight); // Y eksenini çiz
            ctx.strokeStyle = '#888'; // Eksen rengi
            ctx.lineWidth = 1;
            ctx.stroke();

            // X eksen değerlerini çiz
            ctx.fillStyle = '#000';
            const maxT = Math.max(...time); // Zaman dizisinin maksimum değerini bul
            const stepX = Math.ceil(maxT / 5); // 5 adet eşit aralıklı değer oluşturacak adımı hesapla
            for (let i = 0; i <= 5; i++) { // 5 adet dikey çizgi oluşturacağız
                const valueX = i * stepX; // X eksenindeki her değeri eşit aralıklarla ayarla
                const textX = valueX.toFixed(1); // Değerleri 1 ondalık basamağa yuvarla
                const xCoord = valueX / maxT * containerWidth; // X koordinatını hesapla
                ctx.fillText(textX, xCoord, containerHeight / 2 + 15); // Metni çiz, X ekseninin ortasına göster
            }

            // Y eksen değerlerini çiz
            ctx.fillStyle = '#000';
            const maxV = Math.max(...VinValues, ...VoutValues); // Vin ve Vout dizilerinin maksimum değerini bul
            const minV = Math.min(...VinValues, ...VoutValues); // Vin ve Vout dizilerinin minimum değerini bul
            const rangeV = maxV - minV; // Gerilim aralığını hesapla
            const stepY = rangeV / 5; // 5 adet eşit aralıklı değer oluşturacak adımı hesapla
            for (let i = 0; i <= 5; i++) { // 5 adet yatay çizgi oluşturacağız
                const valueY = minV + i * stepY; // Y eksenindeki her değeri eşit aralıklarla ayarla
                const textY = valueY.toFixed(0); // Değerleri tam sayıya yuvarla
                const yCoord = containerHeight - (valueY - minV) / rangeV * containerHeight; // Y koordinatını ters orantılı olarak hesapla
                ctx.fillText(textY, containerWidth / 2 + 10, yCoord); // Metni çiz, Y ekseninin sağ tarafında göster
            }

            // Giriş gerilimi grafiğini çiz
            ctx.beginPath();
            ctx.moveTo(0, containerHeight / 2);
            VinValues.forEach((v, i) => {
                ctx.lineTo(i * (containerWidth / VinValues.length), containerHeight / 2 - v * (containerHeight / 40)); // Ölçek faktörünü görselleştirmek için ayarla
            });
            ctx.strokeStyle = 'red'; // Giriş gerilimi kırmızı renkte
            ctx.lineWidth = 2;
            ctx.stroke();

            // Çıkış gerilimi grafiğini çiz
            ctx.beginPath();
            ctx.moveTo(0, containerHeight / 2);
            VoutValues.forEach((v, i) => {
                ctx.lineTo(i * (containerWidth / VoutValues.length), containerHeight / 2 - v * (containerHeight / 40)); // Ölçek faktörünü görselleştirmek için ayarla
            });
            ctx.strokeStyle = 'blue'; // Çıkış gerilimi mavi renkte
            ctx.lineWidth = 2;
            ctx.stroke();

            // X ve Y eksen adlarını ve grafik adını ekle
            ctx.font = 'bold 12px Arial';
            ctx.fillStyle = 'red'; // Metin rengini kırmızı olarak ayarla
            ctx.fillText('Giriş Gerilimi (Vin)', containerWidth - 130, 20);
            ctx.fillStyle = 'blue'; // Metin rengini mavi olarak ayarla
            ctx.fillText('Çıkış Gerilimi (Vout)', containerWidth - 130, 40);
        }
    