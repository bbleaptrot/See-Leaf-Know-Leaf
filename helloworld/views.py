# -*- coding: utf-8 -*-
from django.http import HttpResponse
from .models import Plant


def index(request):
    plants = Plant.objects.all()
    vals = [entry for entry in plants]
    res = '<table>'
    for plant in vals:
        res += """
            <tr style="height: 300px">
                <td>{plant.scientific_name}</td>
                <td>{plant.common_name}</td>  
                <td><img src="{plant.leaf_image}"/></td>
                <td><img src="{plant.flower_image}"/></td>
                <td><img src="{plant.fruit_image}"/></td>
            </tr>
        """.format(plant=plant)
    res += '</table>'
    # names = map(Plant.objects.all(), lambda plant: plant.scientific_name)
    return HttpResponse(res)


